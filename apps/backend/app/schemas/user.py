# backend/app/schemas/user.py

from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field, validator, root_validator, field_validator, model_validator
from app.core.utils import normalize_phone, normalize_cpf
from enum import Enum
from uuid import UUID
import re
from datetime import datetime

class Role(str, Enum):
    admin = "admin"
    user = "user"

def normalize_cpf(value: str) -> str:
    # Remove tudo que não for dígito
    digits = re.sub(r"\D", "", value or "")
    if len(digits) != 11:
        raise ValueError("CPF inválido: deve ter exatamente 11 dígitos")
    return digits


class LeadCreate(BaseModel):
    phone: Optional[str] = None
    cpf:   Optional[str] = None
    company_id: str

    model_config = ConfigDict(
        extra="ignore"
    )

    @field_validator("phone", mode="before")
    def normalize_phone_if_present(cls, v):
        if v:
            return normalize_phone(v)
        return v

    @field_validator("cpf", mode="before")
    def normalize_cpf_if_present(cls, v):
        if v:
            return normalize_cpf(v)
        return v

    @model_validator(mode="after")
    def require_phone_or_cpf(cls, model: "LeadCreate") -> "LeadCreate":
        if not model.phone and not model.cpf:
            raise ValueError("É necessário fornecer phone ou cpf para o pré‐cadastro")
        return model


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_ids: Optional[List[str]] = Field(None, description="IDs das empresas associadas")
    phone: Optional[str] = None
    cpf: str  # CPF agora é obrigatório no registro completo
    role: Role = Role.user
    accepted_terms: bool = Field(..., description="Usuário aceitou políticas")

    @validator("cpf", pre=True)
    def normalize_cpf_field(cls, v: str) -> str:
        return normalize_cpf(v)

class UserRead(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    cpf: str
    company_ids: List[str] = []
    role: Role
    pre_registered: bool

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    phone: Optional[str] = None
    cpf: Optional[str] = None
    company_ids: Optional[List[str]] = None

    @validator("cpf", pre=True)
    def normalize_cpf_field(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return normalize_cpf(v)
        return v

    model_config = ConfigDict(from_attributes=True)

class UserBasicRead(BaseModel):
    id: UUID
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

class PaginatedUsers(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[UserRead]

    model_config = ConfigDict(from_attributes=True)