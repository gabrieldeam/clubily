# app/schemas/point_purchase.py
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from .point_plan import PointPlanRead
from enum import Enum

class PurchaseStatus(str, Enum):
    PENDING   = "PENDING"
    PAID      = "PAID"
    FAILED    = "FAILED"
    CANCELLED = "CANCELLED"

class PointPurchaseCreate(BaseModel):
    plan_id: UUID

class PointPurchaseRead(BaseModel):
    id: UUID
    plan: Optional[PointPlanRead]
    amount: float
    status: PurchaseStatus
    asaas_id: str
    pix_qr_code: Optional[str]
    pix_copy_paste_code: Optional[str]
    pix_expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedPointPurchases(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[PointPurchaseRead]
