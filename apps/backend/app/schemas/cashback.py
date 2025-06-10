from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)