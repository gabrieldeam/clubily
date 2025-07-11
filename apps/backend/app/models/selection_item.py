from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base
import enum

class SelectionType(str, enum.Enum):
    product = "product"
    category = "category"

class SelectionItem(Base):
    __tablename__ = "selection_items"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    type       = Column(Enum(SelectionType, name="selection_type"), nullable=False)
    item_id    = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # garante apenas um registro do tipo category
        UniqueConstraint('type', 'item_id', name='uq_selection_type_item'),
    )
