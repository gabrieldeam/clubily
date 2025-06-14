from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from app.schemas.cashback_program import CashbackProgramRead
from app.schemas.cashback_program import CashbackProgramRead

class CashbackBase(BaseModel):
    amount_spent: float

class CashbackCreate(CashbackBase):
    program_id: UUID

class CashbackRead(CashbackBase):
    id: UUID
    user_id: UUID
    program_id: UUID
    cashback_value: float
    assigned_at: datetime
    expires_at: datetime
    is_active: bool
    created_at: datetime
    program: CashbackProgramRead
    company_name: str
    company_logo_url: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class CashbackSummary(BaseModel):
    total_balance: float
    next_expiration: Optional[datetime] = None

    model_config = ConfigDict()

class UserCashbackCompany(BaseModel):
    company_id: UUID
    name: str
    logo_url: Optional[str]

    model_config = ConfigDict()


class PaginatedCashbacks(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[CashbackRead]

    model_config = ConfigDict(from_attributes=True)