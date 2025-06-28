# app/models/company_point_purchase.py
import enum
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, Numeric, Enum, DateTime, Text, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PurchaseStatus(str, enum.Enum):
    PENDING   = "PENDING"
    PAID      = "PAID"
    FAILED    = "FAILED"
    CANCELLED = "CANCELLED"

class CompanyPointPurchase(Base):
    __tablename__ = "company_point_purchases"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id   = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id      = Column(UUID(as_uuid=True), ForeignKey("point_plans.id", ondelete="SET NULL"), nullable=True, index=True)
    amount       = Column(Numeric(12,2), nullable=False)  # valor pago
    asaas_id     = Column(String(255), nullable=False, unique=True, index=True)
    pix_qr_code  = Column(Text, nullable=True)
    pix_copy_paste_code = Column(Text, nullable=True)
    pix_expires_at      = Column(DateTime(timezone=True), nullable=True)
    status       = Column(Enum(PurchaseStatus), default=PurchaseStatus.PENDING, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company = relationship(
        "Company",
        back_populates="point_purchases"
    )
    plan = relationship(
        "PointPlan",
        back_populates="purchases"
    )