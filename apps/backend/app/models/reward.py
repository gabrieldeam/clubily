# app/models/reward.py
from __future__ import annotations
from uuid import uuid4
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base

class CompanyReward(Base):
    """
    Produto/recompensa criado pela empresa.
    Pode ser reutilizado em vários templates.
    """
    __tablename__ = "company_rewards"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id  = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(String(120), nullable=False)
    description = Column(String(255), nullable=True)
    image_url   = Column(String(255), nullable=True)
    secret      = Column(Boolean, default=False)     # aparece para o usuário só quando ganhar
    stock_qty   = Column(Integer, nullable=True)     # None → ilimitado

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    template_links = relationship("TemplateRewardLink", cascade="all,delete", back_populates="reward")


class TemplateRewardLink(Base):
    """
    Ligação N:1 entre template e reward + qual carimbo libera.
    """
    __tablename__ = "template_reward_links"
    __table_args__ = (
        UniqueConstraint("template_id", "stamp_no", name="uq_tpl_stamp"),
        UniqueConstraint("template_id", "reward_id", name="uq_tpl_reward"),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("loyalty_card_templates.id", ondelete="CASCADE"), nullable=False)
    reward_id   = Column(UUID(as_uuid=True), ForeignKey("company_rewards.id", ondelete="CASCADE"), nullable=False)
    stamp_no    = Column(Integer, nullable=False)   # em qual carimbo o usuário ganha

    template    = relationship("LoyaltyCardTemplate", back_populates="rewards_map")
    reward      = relationship("CompanyReward", back_populates="template_links")
    redemptions = relationship("RewardRedemptionCode", back_populates="link", cascade="all,delete")


class RewardRedemptionCode(Base):
    """
    Código único que o usuário gera para resgatar um prêmio específico.
    """
    __tablename__ = "reward_redemption_codes"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    link_id     = Column(UUID(as_uuid=True), ForeignKey("template_reward_links.id", ondelete="CASCADE"), nullable=False, index=True)
    instance_id = Column(UUID(as_uuid=True), ForeignKey("loyalty_card_instances.id", ondelete="CASCADE"), nullable=False, index=True)
    code        = Column(String(12), nullable=False, unique=True, index=True)
    expires_at  = Column(DateTime(timezone=True), nullable=False)
    used        = Column(Boolean, default=False)

    instance = relationship("LoyaltyCardInstance", back_populates="redemptions")
    link     = relationship("TemplateRewardLink",  back_populates="redemptions")
