from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class CashbackProgram(Base):
    __tablename__ = "cashback_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    percent = Column(Numeric(5, 2), nullable=False)
    validity_days = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_visible = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    max_per_user = Column(Integer, nullable=True)
    min_cashback_per_user = Column(Numeric(12, 2), nullable=True)
    
    # Relações
    company = relationship("Company", back_populates="cashback_programs")
    cashbacks = relationship("Cashback", back_populates="program", cascade="all, delete-orphan")
