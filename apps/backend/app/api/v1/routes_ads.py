# Placeholder for Ad Campaigns Routes

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from app.schemas import (
    AdCampaign, AdCampaignCreate, AdCampaignUpdate, AdCampaignNextRequest,
    Message, TokenData
)
from app.api import deps
from app.core.db import get_supabase_client
from app.services.ad_selector import get_next_ad_for_store

router = APIRouter()
supabase = get_supabase_client()

# --- Ad Campaign Management (by Merchant/Advertiser) --- #

@router.post("/", response_model=AdCampaign, status_code=status.HTTP_201_CREATED)
async def create_ad_campaign(
    *,
    ad_in: AdCampaignCreate,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Creator role
):
    """
    Create a new ad campaign.
    Creator can be a merchant admin or a third-party advertiser.
    If store_id is provided, verify ownership if creator is merchant_admin.
    """
    if ad_in.store_id and current_user.role == "merchant_admin":
        try:
            store_response = await supabase.table("stores").select("id").eq("id", str(ad_in.store_id)).eq("owner_id", str(current_user.user_id)).maybe_single().execute()
            if not store_response.data:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Store not found or not owned by user")
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error verifying store ownership: {e}")
    elif ad_in.store_id and current_user.role == "third_party_advertiser":
        # Add logic if advertisers need specific permissions to target stores
        pass

    try:
        ad_data = ad_in.model_dump()
        ad_data["creator_id"] = str(current_user.user_id)
        response = await supabase.table("ad_campaigns").insert(ad_data).select().single().execute()
        return AdCampaign(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create ad campaign: {e}")

@router.get("/", response_model=List[AdCampaign])
async def read_ad_campaigns(
    store_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow both to view
):
    """
    Retrieve ad campaigns created by the current user.
    Merchant admins can optionally filter by their stores.
    """
    try:
        query = supabase.table("ad_campaigns").select("*").eq("creator_id", str(current_user.user_id))

        if store_id and current_user.role == "merchant_admin":
            # Verify store ownership before filtering
            owned_stores_response = await supabase.table("stores").select("id").eq("owner_id", str(current_user.user_id)).execute()
            owned_store_ids = [str(store["id"]) for store in owned_stores_response.data]
            if str(store_id) not in owned_store_ids:
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access campaigns for this store")
            query = query.eq("store_id", str(store_id))
        elif store_id:
             query = query.eq("store_id", str(store_id))

        response = await query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        return [AdCampaign(**ad) for ad in response.data]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve ad campaigns: {e}")

@router.get("/{ad_id}", response_model=AdCampaign)
async def read_ad_campaign(
    ad_id: UUID,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow creator to view
):
    """
    Get a specific ad campaign by ID, ensuring it was created by the current user.
    """
    try:
        response = await supabase.table("ad_campaigns").select("*").eq("id", str(ad_id)).eq("creator_id", str(current_user.user_id)).maybe_single().execute()
        if not response.data:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad campaign not found or access denied")
        return AdCampaign(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve ad campaign: {e}")

@router.put("/{ad_id}", response_model=AdCampaign)
async def update_ad_campaign(
    ad_id: UUID,
    *,
    ad_in: AdCampaignUpdate,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow creator to update
):
    """
    Update an ad campaign, ensuring it was created by the current user.
    """
    # Verify ownership first
    await read_ad_campaign(ad_id=ad_id, current_user=current_user)

    try:
        update_data = ad_in.model_dump(exclude_unset=True)
        if not update_data:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

        # Add validation if store_id is changed (check ownership again if merchant)
        if "store_id" in update_data and current_user.role == "merchant_admin":
             new_store_id = update_data["store_id"]
             if new_store_id:
                 store_response = await supabase.table("stores").select("id").eq("id", str(new_store_id)).eq("owner_id", str(current_user.user_id)).maybe_single().execute()
                 if not store_response.data:
                     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign campaign to this store")

        response = await supabase.table("ad_campaigns").update(update_data).eq("id", str(ad_id)).select().single().execute()
        return AdCampaign(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update ad campaign: {e}")

@router.delete("/{ad_id}", response_model=Message)
async def delete_ad_campaign(
    ad_id: UUID,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow creator to delete
):
    """
    Delete an ad campaign, ensuring it was created by the current user.
    """
    # Verify ownership first
    await read_ad_campaign(ad_id=ad_id, current_user=current_user)

    try:
        await supabase.table("ad_campaigns").delete().eq("id", str(ad_id)).execute()
        return Message(message="Ad campaign deleted successfully")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete ad campaign: {e}")

# --- Ad Serving Endpoint (for Kiosk/App) --- #

@router.post("/next", response_model=Optional[AdCampaign])
async def get_next_ad(
    request: AdCampaignNextRequest
    # No auth needed for kiosk/app to fetch ads, relies on service logic
):
    """
    Gets the next relevant ad for a given store and display location.
    Uses the Ad Selector service.
    """
    try:
        ad = await get_next_ad_for_store(
            store_id=request.store_id,
            location=request.location,
            user_context=request.user_context
        )
        return ad
    except Exception as e:
        print(f"Error getting next ad via endpoint: {e}")
        # Return null/empty response rather than 500 if ad selection fails
        return None

