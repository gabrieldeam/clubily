# backend/app/models/user_points_wallet.py
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class UserPointsWallet(Base):
    __tablename__ = "user_points_wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    balance = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="points_wallets")
    transactions = relationship(
        "UserPointsTransaction",
        back_populates="wallet",
        cascade="all, delete-orphan",
        order_by="UserPointsTransaction.created_at.desc()"
    )