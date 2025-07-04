# app/schemas/referral.py
from typing import List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ReferralCode(BaseModel):
    referral_code: str

class ReferralRedeem(BaseModel):
    referral_code: str

class ReferralRead(BaseModel):
    id: UUID
    user_id: UUID
    company_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class ReferralUserRead(BaseModel):
    id: UUID
    name: str
    email: str
    cpf: str
    phone: str

    model_config = ConfigDict(from_attributes=True)

class ReferralCompanyRead(BaseModel):
    id: UUID
    name: str
    email: str
    phone: str
    cnpj: str = Field(..., description="CNPJ da empresa")

    model_config = ConfigDict(from_attributes=True)

class ReferralDetail(BaseModel):
    id: UUID
    referral_code: str = Field(..., description="Código usado")
    user: ReferralUserRead
    company: ReferralCompanyRead
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    
class PaginatedReferralCompanies(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[ReferralCompanyRead]

    model_config = ConfigDict(from_attributes=True)