from uuid import uuid4
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base


class Milestone(Base):
    __tablename__ = "milestones"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title       = Column(String(120),  nullable=False)
    description = Column(String(255),  nullable=True)
    points      = Column(Integer,      nullable=False, index=True)   # limite mínimo
    image_url   = Column(String(255),  nullable=False)
    order       = Column(Integer,      nullable=False, default=0)
    active      = Column(Boolean,      nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True),
                         server_default=func.now(), onupdate=func.now())
