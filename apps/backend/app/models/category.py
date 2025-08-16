from uuid import uuid4
from sqlalchemy import Column, String, Numeric
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from sqlalchemy.orm import relationship
from app.models.association import company_categories

class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    commission_percent = Column(Numeric(5, 2), nullable=True)
    image_url = Column(String(255), nullable=True)
    companies = relationship(
        "Company",
        secondary=company_categories,
        back_populates="categories",
        lazy="joined",
    )