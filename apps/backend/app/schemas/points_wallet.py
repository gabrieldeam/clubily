# app/schemas/points_wallet.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List
from uuid import UUID
from enum import Enum

class PointsBalance(BaseModel):
    balance: int
    model_config = ConfigDict()

class PointsOperation(BaseModel):
    points: int

    model_config = ConfigDict()

class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT  = "debit"

class PointsTransaction(BaseModel):
    id: UUID      
    type: TransactionType
    amount: int
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedPointsTransactions(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[PointsTransaction]

    model_config = ConfigDict(from_attributes=True)