# backend/app/schemas/user_points.py
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from enum import Enum

class UserPointsWalletRead(BaseModel):
    user_id: UUID
    balance: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserPointsTxType(str, Enum):
    award = "award"
    adjustment = "adjustment"

class UserPointsTransactionRead(BaseModel):
    id: UUID
    type: UserPointsTxType
    amount: int
    description: Optional[str]
    rule_id: Optional[UUID]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedUserPointsTransactions(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[UserPointsTransactionRead]

    model_config = ConfigDict(from_attributes=True)