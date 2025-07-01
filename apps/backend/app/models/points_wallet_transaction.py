# backend/app/models/points_wallet_transaction.py
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, Numeric, DateTime, String, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class TransactionType(str, enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"

class PointsWalletTransaction(Base):
    __tablename__ = "points_wallet_transactions"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_id        = Column(UUID(as_uuid=True), ForeignKey("points_wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id       = Column(UUID(as_uuid=True), nullable=False, index=True)
    type             = Column(Enum(TransactionType), nullable=False)
    amount           = Column(Numeric(14,0), nullable=False)
    description      = Column(String(255), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    wallet = relationship("PointsWallet", back_populates="transactions")
