# backend/app/models/user.py

from uuid import uuid4
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.association import user_companies

from app.db.base import Base

class Role(str, PyEnum):
    admin = "admin"
    user = "user"

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email"),
        UniqueConstraint("phone"),
        UniqueConstraint("cpf"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)

    # NOVO CAMPO: CPF (somente dígitos, 11 caracteres)
    cpf = Column(String(11), nullable=True, unique=True, index=True)

    companies = relationship(
        "Company",
        secondary=user_companies,
        back_populates="users",
        lazy="joined",
    )
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(Role), default=Role.user)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_terms = Column(Boolean, default=False, nullable=False)
    pre_registered = Column(Boolean, default=True, nullable=False)
    email_verified_at = Column(DateTime(timezone=True))
    phone_verified_at = Column(DateTime(timezone=True))
    addresses = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    cashbacks = relationship(
        "Cashback",
        back_populates="user",
        lazy="joined",
        cascade="all, delete-orphan",
    )

    # código único de indicação
    referral_code = Column(String(10), unique=True, nullable=True, index=True)
    # indicações resgatadas a partir deste usuário
    referrals = relationship("Referral", back_populates="user", cascade="all, delete-orphan")

    cashback_wallets = relationship(
        "UserCashbackWallet", back_populates="user", cascade="all, delete-orphan"
    )

    wallet_transactions = relationship(
       "WalletTransaction",
       back_populates="user",
       cascade="all, delete-orphan",
       overlaps="wallet_transactions,wallet",
    )

    transfer_methods = relationship(
        "TransferMethod",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    commission_wallet = relationship(
        "CommissionWallet",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    points_wallets = relationship(
        "UserPointsWallet",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    points_stats = relationship(
        "UserPointsStats",
        back_populates="user",
        uselist=False,          # 1-para-1
        cascade="all, delete-orphan"
    )

    reward_orders = relationship("RewardOrder", back_populates="user")