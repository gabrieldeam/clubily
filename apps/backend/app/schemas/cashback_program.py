from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List

class CashbackProgramBase(BaseModel):
    name: str
    description: str
    percent: float = Field(..., ge=0, le=100)
    validity_days: int = Field(..., ge=1, description="Número de dias de validade")
    is_active: bool = True
    is_visible: bool = True
    max_per_user: Optional[int] = Field(
        None, ge=1, description="Máximo de vezes que cada usuário pode usar este programa"
    )
    min_cashback_per_user: Optional[float] = Field(
        None, ge=0, description="Valor mínimo total de cashback que um usuário deve atingir"
    )

class CashbackProgramCreate(CashbackProgramBase):
    pass

class CashbackProgramRead(CashbackProgramBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProgramUsageAssociation(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: EmailStr
    amount_spent: float
    cashback_value: float
    assigned_at: datetime
    expires_at: datetime
    is_active: bool
    created_at: datetime

class PaginatedProgramUsage(BaseModel):
    total_cashback_value: float
    usage_count: int
    average_amount_spent: float

    unique_user_count: int
    average_uses_per_user: float
    average_interval_days: Optional[float] = None

    total_associations: int
    skip: int
    limit: int

    associations: List[ProgramUsageAssociation]

    model_config = ConfigDict(from_attributes=True)


class UserProgramStats(BaseModel):
    program_id: UUID
    user_id: UUID

    # estatísticas para o programa específico
    program_valid_count: int
    program_total_cashback: float

    # estatísticas para todos os programas da empresa
    company_valid_count: int
    company_total_cashback: float

    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedAssociations(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[ProgramUsageAssociation]

    model_config = ConfigDict(from_attributes=True)