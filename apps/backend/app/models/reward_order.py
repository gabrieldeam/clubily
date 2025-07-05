# app/models/reward_order.py
from uuid import uuid4
from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, Enum as PgEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class OrderStatus(str, Enum):
    pending  = "pending"
    approved = "approved"
    refused  = "refused"

class RewardOrder(Base):
    __tablename__ = "reward_orders"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status        = Column(PgEnum(OrderStatus), nullable=False, default=OrderStatus.pending)
    refusal_msg   = Column(String(255), nullable=True)

    # endereço simples embutido:
    recipient     = Column(String(120), nullable=False)
    street        = Column(String(120), nullable=False)
    number        = Column(String(20),  nullable=False)
    neighborhood  = Column(String(120), nullable=False)
    city          = Column(String(120), nullable=False)
    state         = Column(String(2),   nullable=False)
    postal_code   = Column(String(10),  nullable=False)
    complement    = Column(String(120), nullable=True)

    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("RewardOrderItem", back_populates="order", cascade="all, delete-orphan")
    user  = relationship("User", back_populates="reward_orders")

class RewardOrderItem(Base):
    __tablename__ = "reward_order_items"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    order_id   = Column(UUID(as_uuid=True), ForeignKey("reward_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("reward_products.id", ondelete="CASCADE"), nullable=False)
    quantity   = Column(Integer, nullable=False, default=1)

    order      = relationship("RewardOrder", back_populates="items")
    product    = relationship("RewardProduct")
