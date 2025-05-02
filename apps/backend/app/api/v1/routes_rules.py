# Placeholder for Rules Routes

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from app.schemas import Rule, RuleCreate, RuleUpdate, Message, TokenData
from app.api import deps
from app.core.db import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

@router.post("/", response_model=Rule, status_code=status.HTTP_201_CREATED)
async def create_rule(
    *,
    rule_in: RuleCreate,
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Create a new loyalty rule for a store owned by the merchant admin.
    """
    # Verify store ownership
    try:
        store_response = await supabase.table("stores").select("id").eq("id", str(rule_in.store_id)).eq("owner_id", str(current_user.user_id)).maybe_single().execute()
        if not store_response.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Store not found or not owned by user")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error verifying store ownership: {e}")

    try:
        rule_data = rule_in.model_dump()
        # Convert timedelta to seconds if needed, or handle interval string
        if 'cooldown_period' in rule_data and rule_data['cooldown_period']:
             rule_data['cooldown_period'] = f"{rule_data['cooldown_period'].total_seconds()} seconds"

        response = await supabase.table("rules").insert(rule_data).select().single().execute()
        return Rule(**response.data)
    except Exception as e:
        # Handle potential db errors, e.g., duplicate name if constraint exists
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create rule: {e}")

@router.get("/", response_model=List[Rule])
async def read_rules(
    store_id: Optional[UUID] = None, # Filter by store
    skip: int = 0,
    limit: int = 100,
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Retrieve rules for stores owned by the merchant admin.
    Optionally filter by store_id.
    """
    try:
        query = supabase.table("rules").select("*")
        # Ensure user only sees rules for their stores
        owned_stores_response = await supabase.table("stores").select("id").eq("owner_id", str(current_user.user_id)).execute()
        owned_store_ids = [str(store['id']) for store in owned_stores_response.data]

        if not owned_store_ids:
            return [] # No stores, no rules

        query = query.in_("store_id", owned_store_ids)

        if store_id:
            if str(store_id) not in owned_store_ids:
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access rules for this store")
            query = query.eq("store_id", str(store_id))

        response = await query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        return [Rule(**rule) for rule in response.data]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve rules: {e}")


@router.get("/{rule_id}", response_model=Rule)
async def read_rule(
    rule_id: UUID,
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Get a specific rule by ID, ensuring it belongs to the merchant admin's store.
    """
    try:
        # Join with stores to check owner_id directly in the query for efficiency
        response = await supabase.table("rules").select("*, stores!inner(owner_id)").eq("id", str(rule_id)).eq("stores.owner_id", str(current_user.user_id)).maybe_single().execute()

        if not response.data:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found or access denied")

        # Remove the joined store data before validation
        rule_data = response.data
        if "stores" in rule_data:
            del rule_data["stores"]

        return Rule(**rule_data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve rule: {e}")


@router.put("/{rule_id}", response_model=Rule)
async def update_rule(
    rule_id: UUID,
    *,
    rule_in: RuleUpdate,
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Update a rule, ensuring it belongs to the merchant admin's store.
    """
    # First, verify the rule exists and belongs to the user
    await read_rule(rule_id=rule_id, current_user=current_user) # Re-uses the read logic for verification

    try:
        update_data = rule_in.model_dump(exclude_unset=True)
        if not update_data:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

        # Handle cooldown conversion if present
        if 'cooldown_period_seconds' in update_data and update_data['cooldown_period_seconds'] is not None:
             update_data['cooldown_period'] = f"{update_data['cooldown_period_seconds']} seconds"
             del update_data['cooldown_period_seconds'] # Remove schema field if DB field is 'cooldown_period'
        elif 'cooldown_period_seconds' in update_data and update_data['cooldown_period_seconds'] is None:
             update_data['cooldown_period'] = None # Explicitly set to null if provided as null
             del update_data['cooldown_period_seconds']

        response = await supabase.table("rules").update(update_data).eq("id", str(rule_id)).select().single().execute()
        return Rule(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update rule: {e}")


@router.delete("/{rule_id}", response_model=Message)
async def delete_rule(
    rule_id: UUID,
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Delete a rule, ensuring it belongs to the merchant admin's store.
    """
    # Verify ownership first
    await read_rule(rule_id=rule_id, current_user=current_user)

    try:
        await supabase.table("rules").delete().eq("id", str(rule_id)).execute()
        return Message(message="Rule deleted successfully")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete rule: {e}")

