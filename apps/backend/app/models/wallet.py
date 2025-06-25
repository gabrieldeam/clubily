# backend/app/models/wallet.py
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, Numeric, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    balance    = Column(Numeric(14, 2), nullable=False, server_default="0")

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False
    )

    # relacionamento de volta
    company = relationship("Company", back_populates="wallet")

class UserCashbackWallet(Base):
    __tablename__ = "user_cashback_wallets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True),
                        ForeignKey("companies.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    balance = Column(Numeric(12, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_user_company_wallet"),
    )

    user = relationship("User", back_populates="cashback_wallets")
    company = relationship("Company", back_populates="user_cashback_wallets")