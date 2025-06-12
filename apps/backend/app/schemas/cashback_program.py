from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class CashbackProgramBase(BaseModel):
    name: str
    description: str
    percent: float = Field(..., ge=0, le=100)
    validity_days: int = Field(..., ge=1, description="Número de dias de validade")
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