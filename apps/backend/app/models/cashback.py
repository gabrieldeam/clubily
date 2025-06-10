from uuid import uuid4
from sqlalchemy import Column, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Cashback(Base):
    __tablename__ = "cashbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(UUID(as_uuid=True), ForeignKey("cashback_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_spent = Column(Numeric(12, 2), nullable=False)
    cashback_value = Column(Numeric(12, 2), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relações
    user = relationship("User", back_populates="cashbacks")
    program = relationship("CashbackProgram", back_populates="cashbacks")