# backend/app/models/phone_verification.py

import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class PhoneVerification(Base):
    __tablename__ = "phone_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), nullable=False, index=True)
    code = Column(String(6), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # expira em, por exemplo, 5 minutos
    expires_at = Column(DateTime(timezone=True), nullable=False)
