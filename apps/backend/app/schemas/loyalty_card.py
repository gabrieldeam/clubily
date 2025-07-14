# app/schemas/loyalty_card.py
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.reward import LinkRead

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

# ─── misc ------------------------------------------------------
class CodeResponse(BaseModel):
    code: str
    expires_at: datetime


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
