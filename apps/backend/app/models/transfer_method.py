# app/models/transfer_method.py
from uuid import uuid4
import enum
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PixKeyType(str, enum.Enum):
    PHONE   = "PHONE"
    EMAIL   = "EMAIL"
    CPF     = "CPF"
    CNPJ    = "CNPJ"
    RANDOM  = "RANDOM"

class TransferMethod(Base):
    __tablename__ = "transfer_methods"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name       = Column(String(50), nullable=False)          # nome amigável do método
    key_type   = Column(Enum(PixKeyType), nullable=False)
    key_value  = Column(String(100), nullable=False)         # a chave PIX em si
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="transfer_methods")
    withdrawals = relationship("CommissionWithdrawal", back_populates="transfer_method")
