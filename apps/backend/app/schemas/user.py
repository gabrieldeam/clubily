from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from enum import Enum

class Role(str, Enum):
    admin = "admin"
    user = "user"

cpf_regex = r"^\d{11}$"  # 11 dígitos numéricos

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: Optional[str] = None
    phone: Optional[str] = None
    cpf: str = Field(..., pattern=cpf_regex)
    role: Role = Role.user

class UserRead(BaseModel):
    id: str
    name: str
    email: EmailStr
    company_name: Optional[str] = None
    phone: Optional[str] = None
    role: Role
    is_verified: bool

    class Config:
        model_config = ConfigDict(from_attributes=True)
