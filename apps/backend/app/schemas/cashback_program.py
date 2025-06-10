from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class CashbackProgramBase(BaseModel):
    description: str
    percent: float = Field(..., ge=0, le=100)
    valid_until: datetime
    is_active: bool = True
    is_visible: bool = True

class CashbackProgramCreate(CashbackProgramBase):
    pass

class CashbackProgramRead(CashbackProgramBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)