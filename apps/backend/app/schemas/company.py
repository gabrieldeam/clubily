# backend/app/schemas/company.py

from datetime import datetime
from uuid import UUID
import re

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
    logo_url: HttpUrl | None = None

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