import uuid
from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Block(Base):
    __tablename__ = "blocks"
    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id  = Column(UUID(as_uuid=True), ForeignKey("posts.id"), nullable=False, index=True)
    position = Column(Integer, nullable=False)  # ordem dentro do post
    type     = Column(String, nullable=False)   # "text" ou "image"
    content  = Column(JSON, nullable=False)
    # - se type=="text", content = Quill/Slate/etc delta JSON
    # - se type=="image", content = {"url": string, "link": string|null, "caption": string|null}
