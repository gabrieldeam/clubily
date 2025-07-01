# backend/app/schemas/wallet.py
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from enum import Enum

class WalletRead(BaseModel):
    company_id: UUID
    balance: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserCashbackWalletRead(BaseModel):
    id: UUID
    user_id: UUID
    company_id: UUID
    balance: float
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class WalletSummary(BaseModel):
    total_balance: float = 0.0
    wallet_count: int = 0

    model_config = ConfigDict()

class UserWalletRead(BaseModel):
    id: UUID
    user_id: UUID
    company_id: UUID
    balance: Decimal

    model_config = ConfigDict(from_attributes=True)

class WalletWithdraw(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Valor a debitar da carteira do usuário")

    model_config = ConfigDict()


class WalletTransactionRead(BaseModel):
    id: UUID
    company_id: UUID
    user_id: UUID
    amount: Decimal
    created_at: datetime 

    model_config = ConfigDict(from_attributes=True)





class WalletOperation(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None

    model_config = ConfigDict()


class CreditTxType(str, Enum):
    CREDIT = "credit"
    DEBIT  = "debit"

class WalletTransactionRead(BaseModel):
    id: UUID
    type: CreditTxType
    amount: Decimal
    description: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedWalletTransactions(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[WalletTransactionRead]

    model_config = ConfigDict(from_attributes=True)