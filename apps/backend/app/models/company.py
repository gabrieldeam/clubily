# backend/app/models/company.py

from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from app.db.base import Base
from app.models.association import user_companies, company_categories


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

    # Endereço físico
    street = Column(String(255), nullable=False)
    number = Column(String(20), nullable=False)        # número
    neighborhood = Column(String(100), nullable=False)  # bairro
    complement = Column(String(100), nullable=True)     # complemento (opcional)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    customer_id = Column(String(255), nullable=True, unique=True, index=True)
    # Novo: URL do site e flag “venda apenas online”
    online_url = Column(String(255), nullable=True)     # URL do site (opcional)
    only_online = Column(Boolean, default=False, nullable=False)

    accepted_terms = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(Text, nullable=True)
    logo_url = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime(timezone=True))
    phone_verified_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=False, nullable=False)

    # Relações
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

    cashback_programs = relationship(
        "CashbackProgram",
        back_populates="company",
        lazy="joined",
        cascade="all, delete-orphan",
    )
    
    # indicações resgatadas por esta empresa
    referrals = relationship("Referral", back_populates="company", cascade="all, delete-orphan")

    payments = relationship(
        "CompanyPayment",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    wallet   = relationship("Wallet", uselist=False, back_populates="company", cascade="all, delete-orphan")

    user_cashback_wallets = relationship(
        "UserCashbackWallet", back_populates="company", cascade="all, delete-orphan"
    )

    fee_settings = relationship(
        "FeeSetting",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    point_purchases = relationship(
        "CompanyPointPurchase",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    points_wallet   = relationship("PointsWallet", back_populates="company", uselist=False, cascade="all,delete-orphan")

    points_rules = relationship(
       "PointsRule",
       back_populates="company",
       cascade="all, delete-orphan",
       lazy="joined"
    )
    
    branches = relationship("Branch", back_populates="company", cascade="all, delete-orphan")
    inventory_items = relationship("InventoryItem", back_populates="company", cascade="all, delete-orphan")
    product_categories = relationship("ProductCategory", back_populates="company", cascade="all, delete-orphan")
    templates = relationship(
        "LoyaltyCardTemplate",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    location = Column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=True,
        index=True,
    )