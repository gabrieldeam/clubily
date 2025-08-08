from uuid import uuid4
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, Enum, Integer, Numeric,
    ForeignKey, UniqueConstraint, Table
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from geoalchemy2 import Geography
from app.db.base import Base


# Tabelas de associação (muitos-para-muitos)
coupon_categories = Table(
    "coupon_categories",
    Base.metadata,
    Column("coupon_id", UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("product_categories.id", ondelete="CASCADE"), primary_key=True),
)

coupon_items = Table(
    "coupon_items",
    Base.metadata,
    Column("coupon_id", UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="CASCADE"), primary_key=True),
    Column("inventory_item_id", UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), primary_key=True),
)


class DiscountType(str, PyEnum):
    percent = "percent"  # % do pedido
    fixed   = "fixed"    # valor absoluto (moeda)


class Coupon(Base):
    __tablename__ = "coupons"
    __table_args__ = (
        UniqueConstraint("company_id", "code", name="uq_coupon_company_code"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)

    # Obrigatórios
    name = Column(String(120), nullable=False)
    code = Column(String(64), nullable=False, index=True)

    # Opcionais
    description = Column(Text, nullable=True)

    is_active  = Column(Boolean, default=True, nullable=False)
    is_visible = Column(Boolean, default=True, nullable=False)

    usage_limit_total     = Column(Integer, nullable=True)  # total de usos no sistema
    usage_limit_per_user  = Column(Integer, nullable=True)  # por usuário

    min_order_amount = Column(Numeric(14, 2), nullable=True)

    discount_type  = Column(Enum(DiscountType), nullable=True)  # percent | fixed
    discount_value = Column(Numeric(14, 2), nullable=True)

    # Escopo de destino (filtros):
    # - categorias e itens (muitos-para-muitos)
    # - rastreamento de origem (geolocalização e/ou nome do local)
    source_location_name = Column(String(120), nullable=True)
    source_location = Column(Geography(geometry_type="POINT", srid=4326), index=True, nullable=True)  # lon/lat

    # timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relações
    company = relationship("Company", back_populates="coupons")

    categories = relationship(
        "ProductCategory",
        secondary=coupon_categories,
        lazy="selectin",
    )
    items = relationship(
        "InventoryItem",
        secondary=coupon_items,
        lazy="selectin",
    )
