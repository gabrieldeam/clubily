import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
from app.db.base import Base


class HelpCategory(Base):
    __tablename__ = "help_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("help_categories.id"), nullable=True)

    children = relationship(
        "HelpCategory",
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan",
        single_parent=True,     # <<< adicional necessário
    )