# app/schemas/referral.py
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

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
