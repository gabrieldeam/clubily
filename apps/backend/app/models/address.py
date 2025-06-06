# backend/app/models/address.py

from uuid import uuid4
from sqlalchemy import Column, String, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class Address(Base):
    __tablename__ = "addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Campos obrigatórios básicos
    street = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False, default="Brasil")

    # Novos campos:
    number = Column(String(20), nullable=False)               # número da residência
    neighborhood = Column(String(100), nullable=False)         # bairro
    complement = Column(String(255), nullable=True)            # complemento opcional
    is_selected = Column(Boolean, default=False, nullable=False)  # se este é o endereço “principal”

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relação inversa opcional (endereço → usuário)
    user = relationship("User", back_populates="addresses")
