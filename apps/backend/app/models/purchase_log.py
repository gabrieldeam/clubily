# backend/app/models/purchase_log.py
from uuid import uuid4
from sqlalchemy import Column, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.base import Base

class PurchaseLog(Base):
    __tablename__ = "purchase_logs"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    amount     = Column(Numeric(14,2), nullable=False)
    # armazena lista de UUIDs dos itens comprados
    item_ids   = Column(JSONB, nullable=True)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # COMO VOCÊ NÃO PODE FAZER O IN_(JSONB) NO ORM, REMOVA ESSE relationship
    # items = relationship(...)
