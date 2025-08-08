from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_company
from app.schemas.checkout import CheckoutRequest, CheckoutResponse
from app.services.checkout_service import run_checkout

router = APIRouter(tags=["checkout"])

@router.post("/", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_company = Depends(get_current_company),
):
    try:
        purchase_id, coupon_id, redemption_id, discount, final_amount, points_awarded = run_checkout(
            db,
            company_id=str(current_company.id),
            user_id=str(payload.user_id),
            amount=payload.amount,
            item_ids=[str(i) for i in (payload.item_ids or [])],
            branch_id=payload.branch_id,
            event=payload.event,
            coupon_code=payload.coupon_code,
            source_lat=payload.source_lat,
            source_lng=payload.source_lng,
            source_location_name=payload.source_location_name,
            associate_cashback=payload.associate_cashback,
            program_id=str(payload.program_id) if payload.program_id else None,
            stamp_code=payload.stamp_code,
        )
        return CheckoutResponse(
            purchase_id=purchase_id,
            coupon_id=coupon_id,
            redemption_id=redemption_id,
            discount=discount,
            final_amount=final_amount,
            points_awarded=points_awarded,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
