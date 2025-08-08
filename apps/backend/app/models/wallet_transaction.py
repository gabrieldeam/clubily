# app/models/wallet_transaction.py
from uuid import uuid4
from sqlalchemy import (
    Column, String, Numeric, DateTime,
    ForeignKey, ForeignKeyConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    # adiciona este FK simples:
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # e mantém também o FK composto para a carteira
    company_id = Column(UUID(as_uuid=True), nullable=False)
    type       = Column(String(10), nullable=False)       # "credit" ou "debit"
    amount     = Column(Numeric(12, 2), nullable=False)
    description= Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "company_id"],
            ["user_cashback_wallets.user_id", "user_cashback_wallets.company_id"],
            ondelete="CASCADE",
        ),
    )

    # navega de volta para o User, agora que há FK simples
    user = relationship("User", back_populates="wallet_transactions", overlaps="wallet_transactions",)

    # relacionamento para a própria carteira composta
    wallet = relationship(
        "UserCashbackWallet",
        back_populates="transactions",
        primaryjoin=(
            "and_("
            "foreign(WalletTransaction.user_id)==UserCashbackWallet.user_id, "
            "foreign(WalletTransaction.company_id)==UserCashbackWallet.company_id"
            ")"
        ),
        overlaps="wallet_transactions,user",
    )
