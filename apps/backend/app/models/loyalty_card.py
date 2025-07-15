# app/models/loyalty_card.py
from __future__ import annotations

import enum
from uuid import uuid4

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Enum, ForeignKey,
    UniqueConstraint, Numeric, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class RuleType(str, enum.Enum):
    purchase_amount = "purchase_amount"
    visit           = "visit"
    service_done    = "service_done"
    product_bought  = "product_bought"
    category_bought = "category_bought"
    custom_event    = "custom_event"


# ────────────────────────────────────────────────────────────────
class LoyaltyCardTemplate(Base):
    """Modelo principal de cartão."""
    __tablename__ = "loyalty_card_templates"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id     = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    # conteúdo
    title          = Column(String(50),  nullable=False)
    promo_text     = Column(String(120),  nullable=True)

    # design
    color_primary  = Column(String(7),    nullable=True)   # #RRGGBB
    color_bg       = Column(String(7),    nullable=True)
    stamp_icon_url     = Column(String(255),  nullable=True)   # URL do ícone

    # mecânica
    stamp_total    = Column(Integer,     nullable=False)   # nº de marcações
    per_user_limit = Column(Integer,     nullable=False, default=1)
    emission_start = Column(DateTime(timezone=True), nullable=True)
    emission_end   = Column(DateTime(timezone=True), nullable=True)

    emission_limit = Column(Integer, nullable=True)   # None => ilimitado

    active         = Column(Boolean, nullable=False, default=True)

    # housekeeping
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # rel.
    rules      = relationship("LoyaltyCardRule", cascade="all,delete", back_populates="template")
    instances  = relationship("LoyaltyCardInstance", cascade="all,delete", back_populates="template")
    rewards_map = relationship("TemplateRewardLink", cascade="all,delete", back_populates="template")
    company = relationship("Company", back_populates="templates", lazy="joined")

class LoyaltyCardRule(Base):
    __tablename__ = "loyalty_card_rules"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("loyalty_card_templates.id", ondelete="CASCADE"), nullable=False)
    order       = Column(Integer, nullable=False, default=0)

    rule_type   = Column(Enum(RuleType), nullable=False)
    config      = Column(JSON, nullable=False)         # parâmetros variáveis
    active      = Column(Boolean, default=True)

    template    = relationship("LoyaltyCardTemplate", back_populates="rules")


class LoyaltyCardInstance(Base):
    """Cartão emitido para um usuário."""
    __tablename__ = "loyalty_card_instances"
    __table_args__ = (
        UniqueConstraint("template_id", "user_id", name="uq_template_user"),
    )

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id   = Column(UUID(as_uuid=True), ForeignKey("loyalty_card_templates.id", ondelete="CASCADE"), nullable=False)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    issued_at     = Column(DateTime(timezone=True), server_default=func.now())
    expires_at    = Column(DateTime(timezone=True))
    stamps_given  = Column(Integer, default=0)
    completed_at  = Column(DateTime(timezone=True))
    reward_claimed= Column(Boolean, default=False)

    template      = relationship("LoyaltyCardTemplate", back_populates="instances")
    stamps        = relationship("LoyaltyCardStamp", cascade="all,delete")
    codes         = relationship("LoyaltyCardStampCode", cascade="all,delete")
    redemptions = relationship("RewardRedemptionCode", back_populates="instance", cascade="all,delete")


class LoyaltyCardStamp(Base):
    __tablename__ = "loyalty_card_stamps"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    instance_id = Column(UUID(as_uuid=True), ForeignKey("loyalty_card_instances.id", ondelete="CASCADE"), nullable=False)
    stamp_no    = Column(Integer, nullable=False)      # 1..N
    given_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    given_at    = Column(DateTime(timezone=True), server_default=func.now())


class LoyaltyCardStampCode(Base):
    __tablename__ = "loyalty_card_stamp_codes"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    instance_id = Column(UUID(as_uuid=True), ForeignKey("loyalty_card_instances.id", ondelete="CASCADE"), nullable=False, unique=True)
    code        = Column(String(12), nullable=False, unique=True, index=True)
    expires_at  = Column(DateTime(timezone=True), nullable=False)
    used        = Column(Boolean, default=False)
