# backend/app/models/points_rule.py
from uuid import uuid4
from enum import Enum as PyEnum
from sqlalchemy import Column, ForeignKey, Text, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class RuleType(str, PyEnum):
    value_spent = "value_spent"
    event = "event"
    frequency = "frequency"
    category = "category"
    first_purchase = "first_purchase"
    recurrence = "recurrence"
    digital_behavior = "digital_behavior"
    special_date = "special_date"
    geolocation = "geolocation"
    inventory = "inventory"

class PointsRule(Base):
    __tablename__ = "points_rules"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id  = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    rule_type   = Column(SAEnum(RuleType, name="rule_type"), nullable=False)
    config      = Column(JSONB, nullable=False)
    active      = Column(Boolean, default=True, nullable=False)
    visible     = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company     = relationship("Company", back_populates="points_rules")
