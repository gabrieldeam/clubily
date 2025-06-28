from datetime import datetime
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class AdminCompanyBasic(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    phone: Optional[str]
    cnpj: str

    model_config = ConfigDict(from_attributes=True)


class AdminUserBasic(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    cpf: str
    phone: Optional[str]

    model_config = ConfigDict(from_attributes=True)




class AdminProgramRead(BaseModel):
    id: UUID
    name: str
    description: str
    percent: float
    validity_days: int
    is_active: bool
    is_visible: bool
    created_at: datetime
    updated_at: datetime

    company: AdminCompanyBasic

    model_config = ConfigDict(from_attributes=True)


class PaginatedAdminPrograms(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[AdminProgramRead]

    model_config = ConfigDict()
