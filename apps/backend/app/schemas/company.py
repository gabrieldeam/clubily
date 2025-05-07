# backend/app/schemas/company.py

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

class CompanyBase(BaseModel):
    name: str
    email: EmailStr
    phone: str

class CompanyCreate(CompanyBase):
    password: str = Field(..., min_length=8)
    accepted_terms: bool = Field(..., description="Aceite das políticas")

class CompanyRead(CompanyBase):
    id: str
    created_at: datetime
    email_verified: bool
    phone_verified: bool

    model_config = ConfigDict(from_attributes=True)

    @field_validator("email_verified", mode="before")
    def _get_email_verified(cls, v, values):
        return values.get("email_verified_at") is not None

    @field_validator("phone_verified", mode="before")
    def _get_phone_verified(cls, v, values):
        return values.get("phone_verified_at") is not None

class CompanyLogin(BaseModel):
    identifier: str  # email ou telefone
    password: str
