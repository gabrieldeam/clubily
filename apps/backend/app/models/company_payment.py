import enum
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, Numeric, String, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PaymentStatus(str, enum.Enum):
    PENDING   = "PENDING"
    PAID      = "PAID"
    FAILED    = "FAILED"
    CANCELLED = "CANCELLED"

class CompanyPayment(Base):
    __tablename__ = "company_payments"
    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id   = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    amount       = Column(Numeric(12,2), nullable=False)
    asaas_id     = Column(String(255), nullable=False, unique=True, index=True)
    pix_qr_code  = Column(String, nullable=True)
    status       = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="payments")
