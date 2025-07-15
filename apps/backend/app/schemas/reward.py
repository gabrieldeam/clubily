# app/schemas/reward.py
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

# ─── reward ----------------------------------------------------
class RewardBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    secret: bool = False
    stock_qty: Optional[int] = Field(None, ge=0)

class RewardCreate(RewardBase): pass
class RewardUpdate(RewardBase): pass

class RewardRead(RewardBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ─── link  -----------------------------------------------------
class LinkBase(BaseModel):
    stamp_no: int = Field(..., ge=1)

class LinkCreate(LinkBase):
    reward_id: UUID

class LinkRead(LinkBase):
    id: UUID
    reward: RewardRead
    model_config = ConfigDict(from_attributes=True)
    
class RewardRedemptionRead(BaseModel):
    link_id:    UUID
    instance_id: UUID
    used:       bool
    code:       str
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)
