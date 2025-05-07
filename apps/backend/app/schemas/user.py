# backend/app/schemas/user.py

from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from enum import Enum

class Role(str, Enum):
    admin = "admin"
    user = "user"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_ids: Optional[List[str]] = Field(None, description="IDs das empresas associadas")
    phone: Optional[str] = None
    role: Role = Role.user    
    accepted_terms: bool = Field(..., description="Usuário aceitou políticas")

class UserRead(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company_ids: List[str] = []
    phone: Optional[str] = None
    role: Role

    class Config:
        model_config = ConfigDict(from_attributes=True)

class LeadCreate(BaseModel):
    phone: str | None = None
    company_id: str
