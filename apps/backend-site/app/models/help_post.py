import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

# Associação N:M entre posts e categorias
help_post_categories = Table(
    "help_post_categories",
    Base.metadata,
    Column("post_id", UUID(as_uuid=True), ForeignKey("help_posts.id"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("help_categories.id"), primary_key=True),
)

class HelpPost(Base):
    __tablename__ = "help_posts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    categories = relationship(
        "HelpCategory",
        secondary=help_post_categories,
        backref="help_posts",
    )
    blocks = relationship(
        "HelpBlock",
        order_by="HelpBlock.position",
        backref="help_post",
        cascade="all, delete-orphan",
    )
