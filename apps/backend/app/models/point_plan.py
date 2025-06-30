# app/models/point_plan.py
from uuid import uuid4
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship

class PointPlan(Base):
    __tablename__ = "point_plans"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name        = Column(String(100), nullable=False)
    subtitle    = Column(String(150), nullable=True)
    description = Column(Text, nullable=False)
    recommended = Column(Boolean, default=False, nullable=False)
    price       = Column(Numeric(12,2), nullable=False)
    points      = Column(Integer, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    purchases = relationship(
        "CompanyPointPurchase",
        back_populates="plan",
        cascade="all, delete-orphan"
    )