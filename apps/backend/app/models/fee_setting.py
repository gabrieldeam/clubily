import enum
from uuid import uuid4
from sqlalchemy import Column, Enum, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class SettingTypeEnum(str, enum.Enum):
    cashback = "cashback"
    points   = "points"
    loyalty  = "loyalty"

class FeeSetting(Base):
    __tablename__ = "fee_settings"
    __table_args__ = (
        UniqueConstraint("company_id", "setting_type", name="uq_fee_company_type"),
    )

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id   = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    setting_type = Column(Enum(SettingTypeEnum), nullable=False)
    fee_amount   = Column(Numeric(5, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    company = relationship("Company", back_populates="fee_settings")
