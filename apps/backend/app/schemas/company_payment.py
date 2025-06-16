from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING   = "PENDING"
    PAID      = "PAID"
    FAILED    = "FAILED"
    CANCELLED = "CANCELLED"

class CompanyPaymentCreate(BaseModel):
    amount: float = Field(..., ge=25, description="Valor mínimo R$25")

class CompanyPaymentRead(BaseModel):
    id: UUID
    amount: float
    asaas_id: str
    pix_qr_code: Optional[str]
    status: PaymentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CompanyPaymentFilter(BaseModel):
    status: Optional[PaymentStatus]
    date_from: Optional[datetime]
    date_to:   Optional[datetime]

class PaginatedPayments(BaseModel):
    total: int
    skip:  int
    limit: int
    items: List[CompanyPaymentRead]
