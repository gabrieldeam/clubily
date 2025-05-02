# Placeholder for Check-in Routes

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.schemas import VisitCreate, Visit, Message, Profile
from app.api import deps
from app.core.db import get_supabase_client
from app.core.security import get_cpf_hash, verify_cpf # Assuming CPF is used for identification
from app.services.rules_engine import evaluate_rules_for_visit, check_cooldown

router = APIRouter()
supabase = get_supabase_client()

@router.post("/", response_model=Visit, status_code=status.HTTP_201_CREATED)
async def create_visit(
    *, # Make store_id and identifier keyword-only if needed
    visit_in: VisitCreate,
    # No auth required for kiosk check-in initially, but service needs service_role
):
    """
    Registers a new visit (check-in).
    Can be anonymous or identify a user via CPF, phone, or email.
    Triggers the rules engine.
    """
    print(f"Received check-in request for store: {visit_in.store_id}")
    profile_id: Optional[UUID] = None
    profile: Optional[Profile] = None

    # 1. Identify user if identifier is provided
    if visit_in.identifier and visit_in.identifier_type:
        print(f"Attempting to identify user via {visit_in.identifier_type}")
        field_to_query = visit_in.identifier_type
        value_to_query = visit_in.identifier

        if field_to_query == "cpf":
            # Important: We cannot directly query by bcrypt hash efficiently.
            # Strategy 1: Fetch potential users by other means (if available) and verify hash.
            # Strategy 2: If CPF is the *only* identifier, this is problematic for lookup.
            #             Consider storing a separate, indexed, non-reversible hash (e.g., SHA-256) *only* for lookup purposes if absolutely necessary and security implications are understood.
            #             Or require login/different identifier.
            # For now, we'll assume we can get a profile ID somehow and verify later if needed.
            # This placeholder won't work reliably with only bcrypt hash lookup.
            print("Warning: Direct lookup by bcrypt CPF hash is inefficient/insecure. Requires alternative lookup strategy.")
            # Placeholder: Simulate finding a user - replace with actual logic
            # response = await supabase.table("profiles").select("*").eq("some_other_field", value_to_query).maybe_single().execute()
            pass
        elif field_to_query in ["email", "phone_number"]:
            try:
                response = await supabase.table("profiles").select("*").eq(field_to_query, value_to_query).maybe_single().execute()
                if response.data:
                    profile = Profile(**response.data)
                    profile_id = profile.id
                    print(f"User identified: {profile_id}")
            except Exception as e:
                print(f"Error finding profile by {field_to_query}: {e}")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid identifier_type")

    # 2. Check Check-in Cooldown (Example: 5 minutes per user per store)
    # This requires a specific rule to be configured for check-in cooldown
    # We'll simulate checking a hypothetical 'checkin_cooldown_rule'
    # cooldown_rule_id = UUID("...") # Get this from DB based on store/event
    # cooldown_period = timedelta(minutes=5)
    # if profile_id and await check_cooldown(profile_id, cooldown_rule_id, cooldown_period):
    #     raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Check-in cooldown active. Please try again later.")

    # 3. Create the visit record
    try:
        visit_data = visit_in.model_dump(exclude_unset=True)
        # Remove identifier fields as they are not part of the visits table schema
        visit_data.pop("identifier", None)
        visit_data.pop("identifier_type", None)
        visit_data["profile_id"] = profile_id

        response = await supabase.table("visits").insert(visit_data).select().single().execute()
        created_visit = Visit(**response.data)
        print(f"Visit created: {created_visit.id}")

    except Exception as e:
        print(f"Error creating visit: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to record visit")

    # 4. Trigger rules engine asynchronously (or synchronously if required)
    # Consider using a background task runner for longer operations
    try:
        await evaluate_rules_for_visit(created_visit)
    except Exception as e:
        # Log error, but don't fail the check-in itself usually
        print(f"Error evaluating rules for visit {created_visit.id}: {e}")

    return created_visit

