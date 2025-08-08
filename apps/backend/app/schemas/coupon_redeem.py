from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID

class CouponValidateRequest(BaseModel):
    code: str = Field(..., max_length=64)
    user_id: UUID
    amount: float
    item_ids: Optional[List[UUID]] = None
    source_lat: Optional[float] = None
    source_lng: Optional[float] = None
    source_location_name: Optional[str] = None
    dry_run: bool = False  # true = só validar (não grava uso)

class CouponValidateResponse(BaseModel):
    valid: bool
    reason: Optional[str] = None
    coupon_id: Optional[UUID] = None
    discount: float = 0.0
    final_amount: Optional[float] = None
    redemption_id: Optional[UUID] = None
