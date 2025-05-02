# Placeholder for Rules Engine Logic

from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional, Dict, Any

from app.core.db import get_supabase_client
from app.schemas import Visit, SurveyResponse, Rule

supabase = get_supabase_client()

async def evaluate_rules_for_visit(visit: Visit):
    """Evaluates active rules triggered by a visit event."""
    print(f"Evaluating rules for visit {visit.id} at store {visit.store_id}")
    # 1. Fetch active rules for the store and event_type=\'visit\'
    # 2. For each rule:
    #    a. Check conditions (e.g., time of day, first visit)
    #    b. Check cooldowns/limits using user_rule_activations table
    #    c. If conditions met and no cooldown:
    #       i. Execute actions (grant points via RPC, grant badge)
    #       ii. Log activation in user_rule_activations
    # Placeholder: Just print a message
    print("Placeholder: Rules engine evaluated for visit.")
    # Example: Grant 5 points (replace with actual RPC call)
    # try:
    #     if visit.profile_id:
    #         await supabase.rpc(
    #             "add_points",
    #             {
    #                 "p_profile_id": str(visit.profile_id),
    #                 "p_store_id": str(visit.store_id),
    #                 "p_amount": 5,
    #                 "p_transaction_type": "rule_grant",
    #                 "p_related_visit_id": str(visit.id),
    #                 "p_notes": "Visit check-in bonus"
    #             }
    #         ).execute()
    #         print(f"Granted 5 points to profile {visit.profile_id} for visit {visit.id}")
    # except Exception as e:
    #     print(f"Error granting points for visit {visit.id}: {e}")
    pass

async def evaluate_rules_for_survey(response: SurveyResponse):
    """Evaluates active rules triggered by a survey response event."""
    print(f"Evaluating rules for survey response {response.id}")
    # 1. Fetch active rules for the store (if applicable) and event_type=\'survey_response\'
    # 2. For each rule:
    #    a. Check conditions (e.g., specific survey ID, specific answers)
    #    b. Check cooldowns/limits
    #    c. If conditions met:
    #       i. Execute actions
    #       ii. Log activation
    # Placeholder: Just print a message
    print("Placeholder: Rules engine evaluated for survey response.")
    pass

async def check_cooldown(profile_id: UUID, rule_id: UUID, cooldown_period: Optional[timedelta]) -> bool:
    """Checks if the user is currently in a cooldown period for a specific rule."""
    if not cooldown_period or not profile_id:
        return False # No cooldown defined or anonymous user

    try:
        # Find the last activation for this user and rule
        response = await supabase.table("user_rule_activations")\
            .select("activated_at")\
            .eq("profile_id", str(profile_id))\
            .eq("rule_id", str(rule_id))\
            .order("activated_at", desc=True)\
            .limit(1)\
            .maybe_single()\
            .execute()

        if response.data:
            last_activation_time = datetime.fromisoformat(response.data["activated_at"])
            if datetime.now(last_activation_time.tzinfo) < last_activation_time + cooldown_period:
                print(f"Cooldown active for profile {profile_id}, rule {rule_id}")
                return True # Cooldown is active
    except Exception as e:
        print(f"Error checking cooldown: {e}")
        # Fail safe: assume cooldown is not active if check fails

    return False # Cooldown is not active

