### backend/app/models/product_category.py ###
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

# association table many‑to‑many between inventory items and categories
inventory_item_categories = Table(
    "inventory_item_categories",
    Base.metadata,
    Column("inventory_item_id", UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("product_categories.id", ondelete="CASCADE"), primary_key=True),
)

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(120), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="product_categories")
    items = relationship("InventoryItem", secondary=inventory_item_categories, back_populates="categories")
