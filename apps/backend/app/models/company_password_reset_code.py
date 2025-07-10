# app/models/company_password_reset_code.py
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base        # mesmo base dos outros modelos

class CompanyPasswordResetCode(Base):
    __tablename__ = "company_password_reset_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code = Column(String(6), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, nullable=False, server_default="false")
