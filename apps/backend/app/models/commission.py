# app/models/commission.py
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, Numeric, String, DateTime, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class CommissionTransactionType(str, enum.Enum):
    credit = "credit"
    debit  = "debit"

class CommissionWithdrawalStatus(str, enum.Enum):
    pending   = "pending"
    approved  = "approved"
    rejected  = "rejected"

class CommissionWallet(Base):
    __tablename__ = "commission_wallets"
    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    user = relationship(
        "User",
        back_populates="commission_wallet",
        uselist=False,
    )
    balance  = Column(Numeric(14,2), nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    transactions = relationship("CommissionTransaction", back_populates="wallet", cascade="all, delete-orphan")
    withdrawals  = relationship("CommissionWithdrawal", back_populates="wallet", cascade="all, delete-orphan")

class CommissionTransaction(Base):
    __tablename__ = "commission_transactions"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_id   = Column(UUID(as_uuid=True), ForeignKey("commission_wallets.id", ondelete="CASCADE"), nullable=False)
    type        = Column(SQLEnum(CommissionTransactionType), nullable=False)
    amount      = Column(Numeric(12,2), nullable=False)
    description = Column(String(255), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    wallet = relationship("CommissionWallet", back_populates="transactions")

class CommissionWithdrawal(Base):
    __tablename__ = "commission_withdrawals"
    transfer_method_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transfer_methods.id", ondelete="SET NULL"),
        nullable=True
    )
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_id  = Column(UUID(as_uuid=True), ForeignKey("commission_wallets.id", ondelete="CASCADE"), nullable=False)
    amount     = Column(Numeric(12,2), nullable=False)
    status     = Column(SQLEnum(CommissionWithdrawalStatus), nullable=False, default=CommissionWithdrawalStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    wallet = relationship("CommissionWallet", back_populates="withdrawals")
    transfer_method = relationship(
        "TransferMethod",
        back_populates="withdrawals"
    )
    @property
    def user(self):
        return self.wallet.user
