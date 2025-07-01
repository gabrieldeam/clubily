from uuid import uuid4
from enum import Enum
from sqlalchemy import Column, ForeignKey, Numeric, DateTime, String, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class CreditTxType(str, Enum):
    CREDIT = "credit"
    DEBIT  = "debit"

class CreditsWalletTransaction(Base):
    __tablename__ = "credits_wallet_transactions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_id  = Column(UUID(as_uuid=True),
                        ForeignKey("wallets.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    type       = Column(PgEnum(CreditTxType), nullable=False)
    amount     = Column(Numeric(14,2), nullable=False)
    description= Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    wallet = relationship("Wallet", back_populates="transactions")
