from uuid import uuid4
from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from app.db.base import Base

class CouponRedemption(Base):
    __tablename__ = "coupon_redemptions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    coupon_id  = Column(UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    amount            = Column(Numeric(14,2), nullable=False)  # valor do pedido antes do desconto
    discount_applied  = Column(Numeric(14,2), nullable=False)
    item_ids          = Column(JSONB, nullable=True)

    source_location_name = Column(String(120), nullable=True)
    redemption_location  = Column(Geography(geometry_type="POINT", srid=4326), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    coupon = relationship("Coupon")
