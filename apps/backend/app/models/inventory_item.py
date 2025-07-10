# backend/app/models/inventory_item.py
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id  = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    sku         = Column(String(64), nullable=False,)
    name        = Column(String(255), nullable=False)
    price       = Column(Numeric(14,2), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    company     = relationship("Company", back_populates="inventory_items")
    categories  = relationship("ProductCategory", secondary="inventory_item_categories", back_populates="items")

    # sem relação para purchase_logs, já que você está usando JSONB em PurchaseLog
    # purchase_logs = relationship(...)
