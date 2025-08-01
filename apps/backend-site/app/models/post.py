import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

# associação N:M Post ↔ Category
post_categories = Table(
    "post_categories",
    Base.metadata,
    Column("post_id",     UUID(as_uuid=True), ForeignKey("posts.id"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id"), primary_key=True),
)

class Post(Base):
    __tablename__ = "posts"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title       = Column(String, nullable=False, index=True)
    slug        = Column(String, nullable=False, unique=True, index=True)
    author_id   = Column(UUID(as_uuid=True), ForeignKey("authors.id"), nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    thumbnail_url = Column(String, nullable=True)

    author     = relationship("Author", backref="posts")
    categories = relationship("Category", secondary=post_categories, backref="posts")
    blocks     = relationship("Block", order_by="Block.position", backref="post", cascade="all, delete-orphan")
