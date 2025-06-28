# app/models/points_wallet.py
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, Numeric, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PointsWallet(Base):
    __tablename__ = "points_wallets"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    balance    = Column(Numeric(14,0), nullable=False, server_default="0")  # pontos como inteiro
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="points_wallet")
