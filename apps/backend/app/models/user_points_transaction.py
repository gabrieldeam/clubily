# backend/app/models/user_points_transaction.py
from uuid import uuid4
from enum import Enum
from sqlalchemy import Column, ForeignKey, Integer, DateTime, Text, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class UserPointsTxType(str, Enum):
    award = "award"
    adjustment = "adjustment"

class UserPointsTransaction(Base):
    __tablename__ = "user_points_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("user_points_wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("points_rules.id", ondelete="SET NULL"), nullable=True)
    type = Column(PgEnum(UserPointsTxType), nullable=False)
    amount = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    wallet = relationship("UserPointsWallet", back_populates="transactions")
    rule = relationship("PointsRule")