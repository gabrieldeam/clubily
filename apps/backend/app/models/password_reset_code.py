# app/models/password_reset_code.py
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    code = Column(String(6), nullable=False, index=True)        # código “visível”
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
