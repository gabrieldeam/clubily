# app/models/user_points_stats.py
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class UserPointsStats(Base):
    __tablename__ = "user_points_stats"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id         = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    lifetime_points = Column(Integer, nullable=False, server_default="0")
    today_points    = Column(Integer, nullable=False, server_default="0")
    month_points    = Column(Integer, nullable=False, server_default="0")
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="points_stats")