# Placeholder for Surveys Routes

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from app.schemas import (
    Survey, SurveyCreate, SurveyUpdate,
    SurveyResponse, SurveyResponseCreate,
    Message, TokenData, Profile
)
from app.api import deps
from app.core.db import get_supabase_client
from app.services.rules_engine import evaluate_rules_for_survey

router = APIRouter()
supabase = get_supabase_client()

# --- Survey Management (by Merchant/Advertiser) --- #

@router.post("/", response_model=Survey, status_code=status.HTTP_201_CREATED)
async def create_survey(
    *,
    survey_in: SurveyCreate,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Creator role
):
    """
    Create a new survey.
    Creator can be a merchant admin or a third-party advertiser.
    If store_id is provided, verify ownership if creator is merchant_admin.
    """
    if survey_in.store_id and current_user.role == "merchant_admin":
        try:
            store_response = await supabase.table("stores").select("id").eq("id", str(survey_in.store_id)).eq("owner_id", str(current_user.user_id)).maybe_single().execute()
            if not store_response.data:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Store not found or not owned by user")
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error verifying store ownership: {e}")
    elif survey_in.store_id and current_user.role == "third_party_advertiser":
        # Advertisers might create global surveys or need different validation
        # For now, allow if store_id is null or handle specific logic
        # If they *can* target specific stores, how is permission granted? Assume allowed for now.
        pass

    try:
        survey_data = survey_in.model_dump()
        survey_data["creator_id"] = str(current_user.user_id)
        response = await supabase.table("surveys").insert(survey_data).select().single().execute()
        return Survey(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create survey: {e}")

@router.get("/", response_model=List[Survey])
async def read_surveys(
    store_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow both to view
):
    """
    Retrieve surveys created by the current user.
    Merchant admins can optionally filter by their stores.
    """
    try:
        query = supabase.table("surveys").select("*").eq("creator_id", str(current_user.user_id))

        if store_id and current_user.role == "merchant_admin":
            # Verify store ownership before filtering
            owned_stores_response = await supabase.table("stores").select("id").eq("owner_id", str(current_user.user_id)).execute()
            owned_store_ids = [str(store["id"]) for store in owned_stores_response.data]
            if str(store_id) not in owned_store_ids:
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access surveys for this store")
            query = query.eq("store_id", str(store_id))
        elif store_id:
             # Advertiser filtering by store_id might need different logic
             query = query.eq("store_id", str(store_id))

        response = await query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        return [Survey(**survey) for survey in response.data]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve surveys: {e}")

@router.get("/{survey_id}", response_model=Survey)
async def read_survey(
    survey_id: UUID,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow creator to view
):
    """
    Get a specific survey by ID, ensuring it was created by the current user.
    """
    try:
        response = await supabase.table("surveys").select("*").eq("id", str(survey_id)).eq("creator_id", str(current_user.user_id)).maybe_single().execute()
        if not response.data:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found or access denied")
        return Survey(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve survey: {e}")

@router.put("/{survey_id}", response_model=Survey)
async def update_survey(
    survey_id: UUID,
    *,
    survey_in: SurveyUpdate,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow creator to update
):
    """
    Update a survey, ensuring it was created by the current user.
    """
    # Verify ownership first
    await read_survey(survey_id=survey_id, current_user=current_user)

    try:
        update_data = survey_in.model_dump(exclude_unset=True)
        if not update_data:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

        # Add validation if store_id is changed (check ownership again if merchant)
        if "store_id" in update_data and current_user.role == "merchant_admin":
             new_store_id = update_data["store_id"]
             if new_store_id:
                 store_response = await supabase.table("stores").select("id").eq("id", str(new_store_id)).eq("owner_id", str(current_user.user_id)).maybe_single().execute()
                 if not store_response.data:
                     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign survey to this store")
             # else: allow setting store_id to null

        response = await supabase.table("surveys").update(update_data).eq("id", str(survey_id)).select().single().execute()
        return Survey(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update survey: {e}")

@router.delete("/{survey_id}", response_model=Message)
async def delete_survey(
    survey_id: UUID,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Allow creator to delete
):
    """
    Delete a survey, ensuring it was created by the current user.
    """
    # Verify ownership first
    await read_survey(survey_id=survey_id, current_user=current_user)

    try:
        await supabase.table("surveys").delete().eq("id", str(survey_id)).execute()
        return Message(message="Survey deleted successfully")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete survey: {e}")

# --- Survey Response Submission --- #

@router.post("/{survey_id}/answer", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
async def submit_survey_response(
    survey_id: UUID,
    *,
    response_in: SurveyResponseCreate,
    # No auth required for submission endpoint (can be anonymous)
):
    """
    Submits a response to a survey.
    Can be anonymous or identify a user.
    Triggers the rules engine.
    """
    # 1. Validate Survey Exists and is Active
    try:
        survey_response = await supabase.table("surveys")\
            .select("id, max_responses, store_id")\
            .eq("id", str(survey_id))\
            .eq("is_active", True)\
            .lte("start_date", "now()")\
            .or_(f"end_date.is.null,end_date.gte.now()")\
            .maybe_single().execute()
        if not survey_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found, not active, or outside valid dates")
        survey_details = survey_response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error validating survey: {e}")

    # 2. Check Max Responses Quota (if applicable)
    if survey_details.get("max_responses") is not None:
        try:
            count_response = await supabase.table("survey_responses")\
                .select("id", count="exact")\
                .eq("survey_id", str(survey_id))\
                .execute()
            if count_response.count >= survey_details["max_responses"]:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Survey response limit reached")
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error checking response count: {e}")

    # 3. Identify user if identifier is provided
    profile_id: Optional[UUID] = None
    if response_in.identifier and response_in.identifier_type:
        field_to_query = response_in.identifier_type
        value_to_query = response_in.identifier
        if field_to_query == "cpf":
            print("Warning: Direct lookup by bcrypt CPF hash is inefficient/insecure.")
            # Add alternative lookup logic here if needed
            pass
        elif field_to_query in ["email", "phone_number"]:
            try:
                profile_res = await supabase.table("profiles").select("id").eq(field_to_query, value_to_query).maybe_single().execute()
                if profile_res.data:
                    profile_id = profile_res.data["id"]
                    print(f"User identified for survey response: {profile_id}")
            except Exception as e:
                print(f"Error finding profile for survey response: {e}")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid identifier_type")

    # 4. Create the survey response record
    try:
        response_data = response_in.model_dump(exclude_unset=True)
        response_data.pop("identifier", None)
        response_data.pop("identifier_type", None)
        response_data["survey_id"] = survey_id
        response_data["profile_id"] = profile_id
        # Use store_id from survey if not provided in request, or keep null
        response_data["store_id"] = response_data.get("store_id") or survey_details.get("store_id")

        insert_response = await supabase.table("survey_responses").insert(response_data).select().single().execute()
        created_response = SurveyResponse(**insert_response.data)
        print(f"Survey response created: {created_response.id}")

    except Exception as e:
        print(f"Error creating survey response: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save survey response")

    # 5. Trigger rules engine (asynchronously)
    try:
        await evaluate_rules_for_survey(created_response)
    except Exception as e:
        print(f"Error evaluating rules for survey response {created_response.id}: {e}")

    return created_response

# --- Endpoint to view responses (for survey creators) --- #

@router.get("/{survey_id}/responses", response_model=List[SurveyResponse])
async def read_survey_responses(
    survey_id: UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: TokenData = Depends(deps.require_role(["merchant_admin", "third_party_advertiser"])) # Creator role
):
    """
    Retrieve responses for a specific survey created by the current user.
    """
    # Verify the user created this survey first
    await read_survey(survey_id=survey_id, current_user=current_user)

    try:
        response = await supabase.table("survey_responses")\
            .select("*")\
            .eq("survey_id", str(survey_id))\
            .order("created_at", desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()
        return [SurveyResponse(**resp) for resp in response.data]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve survey responses: {e}")

