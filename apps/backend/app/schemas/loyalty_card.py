# app/schemas/loyalty_card.py
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field
from app.schemas.reward import LinkRead
from app.schemas.company import CompanyBasic
from app.schemas.reward import RewardRedemptionRead

# ─── shared ----------------------------------------------------
class RuleBase(BaseModel):
    rule_type: str
    config: dict
    order:   int = 0
    active:  bool = True

class RuleCreate(RuleBase):  pass

class RuleRead(RuleBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

# ─── template --------------------------------------------------
class TemplateBase(BaseModel):
    title: str
    promo_text: Optional[str] = None
    color_primary: Optional[str] = Field(None, pattern=r"#?[0-9A-Fa-f]{6}")
    color_bg: Optional[str] = Field(None, pattern=r"#?[0-9A-Fa-f]{6}")
    stamp_icon_url: Optional[str] = None
    stamp_total: int
    per_user_limit: int = 1
    emission_start: Optional[datetime] = None
    emission_end:   Optional[datetime] = None
    emission_limit: Optional[int] = Field(None, ge=1)
    active: bool = True

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(TemplateBase):
    pass

class TemplateRead(TemplateBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    rules: List[RuleRead] = []
    rewards_map:  List[LinkRead]    = [] 
    company:    CompanyBasic  
    model_config = ConfigDict(from_attributes=True)

# ─── instance --------------------------------------------------
class InstanceRead(BaseModel):
    id: UUID
    template_id: UUID
    user_id: UUID
    issued_at: datetime
    expires_at: Optional[datetime]
    stamps_given: int
    completed_at: Optional[datetime]
    reward_claimed: bool
    model_config = ConfigDict(from_attributes=True)

class StampRead(BaseModel):
    stamp_no: int
    given_at: datetime
    given_by_id: Optional[UUID]
    model_config = ConfigDict(from_attributes=True)

class InstanceDetail(InstanceRead):
    template: TemplateRead
    stamps: List[StampRead]    
    redemptions: List[RewardRedemptionRead] = []

# ─── misc ------------------------------------------------------
class CodeResponse(BaseModel):
    code: str
    expires_at: datetime
    used: bool
    model_config = ConfigDict(from_attributes=True)


# src/schemas/loyalty.py

class StampPayload(BaseModel):
    code: str = Field(..., description="Código gerado pelo usuário")
    amount: Optional[Decimal] = None
    # para ambos product_bought e category_bought
    purchased_items: Optional[List[UUID]] = Field(
        None, description="IDs dos produtos comprados"
    )
    service_id: Optional[UUID] = None
    event_name: Optional[str] = None

    # substitui o visit:bool
    visit_count: Optional[int] = Field(
        None, description="Número de visitas para a regra 'visit'"
    )

    model_config = ConfigDict(from_attributes=True)



class InstanceAdminDetail(InstanceRead):
    user_name: str
    user_email: str
    stamp_total: int = Field(..., description="Total de carimbos do template")
    total_rewards: int = Field(..., description="Total de recompensas atreladas ao template")
    redeemed_count: int = Field(..., description="Recompensas já resgatadas")
    pending_count: int = Field(..., description="Recompensas ganhas mas não resgatadas")
    model_config = ConfigDict(from_attributes=True)

# ─── PAYLOAD: emitir cartão para um usuário ─────────────────────────────────────
class IssueForUserPayload(BaseModel):
    user_id: UUID

# app/schemas/loyalty_card.py

class StampData(BaseModel):
    amount: Optional[Decimal] = None
    purchased_items: Optional[List[UUID]] = None
    service_id: Optional[UUID] = None
    event_name: Optional[str] = None
    visit_count: Optional[int] = None

class StampWithCode(StampData):
    code: str
