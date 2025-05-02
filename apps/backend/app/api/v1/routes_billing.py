# Placeholder for Billing Routes (Simulation)

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from app.schemas import (
    BillingSubscription, BillingInvoice, Message, TokenData
)
from app.api import deps
from app.core.db import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

# --- Subscription Management (Simulated) --- #

@router.get("/subscription", response_model=Optional[BillingSubscription])
async def get_my_subscription(
    store_id: UUID, # Require store_id to identify the subscription
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Get the billing subscription details for a specific store owned by the merchant.
    (Simulated - Fetches from DB, no actual Stripe interaction)
    """
    try:
        # Verify store ownership
        store_response = await supabase.table("stores").select("id").eq("id", str(store_id)).eq("owner_id", str(current_user.user_id)).maybe_single().execute()
        if not store_response.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Store not found or not owned by user")

        # Fetch subscription
        response = await supabase.table("billing_subscriptions")\
            .select("*")\
            .eq("store_id", str(store_id))\
            .eq("profile_id", str(current_user.user_id))\
            .maybe_single().execute()

        if not response.data:
            # Simulate creating a default 'free' plan if none exists
            print(f"No subscription found for store {store_id}, simulating creation of free plan.")
            free_plan_data = {
                "store_id": str(store_id),
                "profile_id": str(current_user.user_id),
                "plan_id": "free",
                "status": "active",
                # Add other defaults as needed
            }
            create_response = await supabase.table("billing_subscriptions").insert(free_plan_data).select().single().execute()
            return BillingSubscription(**create_response.data)
            # return None # Or return None if no subscription exists and no default is created

        return BillingSubscription(**response.data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve subscription: {e}")

@router.post("/subscription/manage", response_model=Message)
async def manage_subscription(
    store_id: UUID,
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Simulates redirecting to a Stripe Customer Portal or similar management interface.
    In a real implementation, this would generate a portal session URL.
    """
    # Verify store ownership and fetch subscription (optional, but good practice)
    await get_my_subscription(store_id=store_id, current_user=current_user)

    # Placeholder: Return a message indicating where the user *would* be redirected.
    return Message(message=f"Simulation: User for store {store_id} would be redirected to Stripe Customer Portal.")

# --- Invoice History (Simulated) --- #

@router.get("/invoices", response_model=List[BillingInvoice])
async def get_my_invoices(
    store_id: UUID,
    skip: int = 0,
    limit: int = 10,
    current_user: TokenData = Depends(deps.get_current_active_merchant_admin)
):
    """
    Get the billing invoice history for a specific store owned by the merchant.
    (Simulated - Fetches from DB, no actual Stripe interaction)
    """
    try:
        # Verify store ownership
        store_response = await supabase.table("stores").select("id").eq("id", str(store_id)).eq("owner_id", str(current_user.user_id)).maybe_single().execute()
        if not store_response.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Store not found or not owned by user")

        # Fetch invoices
        response = await supabase.table("billing_invoices")\
            .select("*")\
            .eq("store_id", str(store_id))\
            .eq("profile_id", str(current_user.user_id))\
            .order("created_at", desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()

        # Simulate some invoices if none exist
        if not response.data:
             print(f"No invoices found for store {store_id}, returning empty list.")
             # Optionally, simulate creation of dummy invoices for demo purposes
             return []

        return [BillingInvoice(**invoice) for invoice in response.data]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve invoices: {e}")

# Note: Webhook endpoints for Stripe events (invoice.paid, customer.subscription.updated, etc.)
# would be implemented separately and would not typically require user authentication.
# These webhooks would update the billing_subscriptions and billing_invoices tables.

