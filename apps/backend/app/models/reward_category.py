# app/models/reward_category.py
from uuid import uuid4
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class RewardCategory(Base):
    __tablename__ = "reward_categories"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name        = Column(String(120), nullable=False, unique=True)
    slug        = Column(String(120), nullable=False, unique=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
