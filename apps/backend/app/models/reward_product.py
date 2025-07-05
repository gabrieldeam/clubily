# app/models/reward_product.py
from uuid import uuid4
from sqlalchemy import Column, String, Integer, Text, Numeric, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

reward_product_categories = Table(
    "reward_product_categories",
    Base.metadata,
    Column("product_id",  UUID(as_uuid=True), ForeignKey("reward_products.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("reward_categories.id", ondelete="CASCADE"), primary_key=True),
)

class RewardProduct(Base):
    __tablename__ = "reward_products"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name        = Column(String(255), nullable=False)
    sku         = Column(String(64), nullable=False, unique=True)
    short_desc  = Column(String(255), nullable=True)
    long_desc   = Column(Text, nullable=True)
    points_cost = Column(Integer, nullable=False)
    image_url   = Column(String(255), nullable=True)
    pdf_url     = Column(String(255), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    categories  = relationship(
        "RewardCategory",
        secondary=reward_product_categories,
        backref="products"
    )
