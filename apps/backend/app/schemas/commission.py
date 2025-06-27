# app/schema/commission.py

from datetime import datetime
from uuid import UUID
from typing import List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.transfer_method import TransferMethodRead
from app.schemas.user import UserBasicRead
from app.models.commission import CommissionWithdrawalStatus

class CommissionBalance(BaseModel):
    balance: float
    model_config = ConfigDict()

class CommissionTxRead(BaseModel):
    id: UUID
    type: str
    amount: float
    description: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaginatedCommissionTx(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[CommissionTxRead]
    model_config = ConfigDict()

class CommissionWithdrawalCreate(BaseModel):
    amount: float
    transfer_method_id: UUID

class CommissionWithdrawalRead(BaseModel):
    id: UUID
    amount: float
    status: CommissionWithdrawalStatus
    created_at: datetime = Field(..., alias="created_at")
    # dados do usuário que pediu o saque
    user: UserBasicRead
    # dados do PIX selecionado
    transfer_method: TransferMethodRead | None

    model_config = ConfigDict(from_attributes=True)
