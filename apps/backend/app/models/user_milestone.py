from uuid import uuid4
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship


class UserMilestone(Base):
    __tablename__ = "user_milestones"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id      = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False)
    achieved_at  = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "milestone_id", name="uq_user_milestone"),)
    
    milestone = relationship("Milestone", backref="user_links")