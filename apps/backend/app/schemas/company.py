# backend/app/schemas/company.py

from datetime import datetime
from uuid import UUID
import re
from typing import List, Optional
from uuid import UUID
from app.schemas.category import CategoryRead


from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    computed_field,
    ConfigDict,
    field_validator,
    HttpUrl,
)


class CompanyBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    cnpj: str
    street: str
    city: str
    state: str
    postal_code: str
    description: str | None = None

    @field_validator("cnpj", mode="before")
    def normalize_cnpj(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v or "")
        if len(digits) != 14:
            raise ValueError("CNPJ inválido: deve ter 14 dígitos")
        return digits


class CompanyCreate(CompanyBase):
    password: str = Field(..., min_length=8)
    accepted_terms: bool = Field(..., description="Aceite das políticas")


class CompanyRead(CompanyBase):
    id: UUID
    created_at: datetime
    email_verified_at: datetime | None = None
    phone_verified_at: datetime | None = None
    is_active: bool
    logo_url: str | None = None
    categories: List[CategoryRead] = []

    @computed_field
    @property
    def email_verified(self) -> bool:
        return self.email_verified_at is not None

    @computed_field
    @property
    def phone_verified(self) -> bool:
        return self.phone_verified_at is not None

    model_config = ConfigDict(from_attributes=True)


class CompanyLogin(BaseModel):
    identifier: str  # email ou telefone
    password: str

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cnpj: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    description: Optional[str] = None
    category_ids: Optional[List[UUID]] = None

    @field_validator("cnpj", mode="before")
    def normalize_cnpj(cls, v: str) -> str:
        from re import sub
        digits = sub(r"\D", "", v or "")
        if len(digits) != 14:
            raise ValueError("CNPJ inválido")
        return digits

    model_config = ConfigDict(from_attributes=True)
