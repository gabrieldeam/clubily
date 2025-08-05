import uuid
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class HelpBlock(Base):
    __tablename__ = "help_blocks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("help_posts.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    content  = Column(JSONB, nullable=False)