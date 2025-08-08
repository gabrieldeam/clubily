from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class CheckoutRequest(BaseModel):
    user_id: UUID
    amount: float
    item_ids: Optional[List[UUID]] = None
    branch_id: Optional[str] = None
    event: Optional[str] = None

    coupon_code: Optional[str] = None
    source_lat: Optional[float] = None
    source_lng: Optional[float] = None
    source_location_name: Optional[str] = None

    associate_cashback: bool = False
    program_id: Optional[UUID] = None
    stamp_code: Optional[str] = None

    # opcional: idempotência (recomendo muito)
    idempotency_key: Optional[str] = None

class CheckoutResponse(BaseModel):
    purchase_id: UUID
    coupon_id: Optional[UUID] = None
    redemption_id: Optional[UUID] = None
    discount: float
    final_amount: float
    points_awarded: float = 0.0
