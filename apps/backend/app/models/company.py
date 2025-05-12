# backend/app/models/company.py

from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, UniqueConstraint,Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.association import user_companies
from app.models.association import company_categories
from sqlalchemy.orm import relationship

class Company(Base):
    __tablename__ = "companies"
    __table_args__ = (
        UniqueConstraint("email"),
        UniqueConstraint("phone"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    cnpj = Column(String(14), nullable=False, unique=True, index=True)
    street = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    accepted_terms = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(Text, nullable=True)
    logo_url = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime(timezone=True))
    phone_verified_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=False, nullable=False)
    users = relationship(
        "User",
        secondary=user_companies,
        back_populates="companies",
        lazy="joined",
    )
    categories = relationship(
        "Category",
        secondary=company_categories,
        back_populates="companies",
        lazy="joined",
    )
