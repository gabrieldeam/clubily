import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Author(Base):
    __tablename__ = "authors"
    id   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    bio  = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
