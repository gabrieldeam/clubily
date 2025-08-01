import uuid
from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Banner(Base):
    __tablename__ = "banners"
    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title    = Column(String, nullable=False)
    image_url= Column(String, nullable=False)
    link_url = Column(String, nullable=True)
    order    = Column(Integer, nullable=False, default=0, index=True)
