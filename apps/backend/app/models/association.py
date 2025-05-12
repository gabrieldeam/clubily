
# backend/app/models/association.py

from sqlalchemy import Table, Column, ForeignKey
from app.db.base import Base
from sqlalchemy.dialects.postgresql import UUID

user_companies = Table(
    "user_companies",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("company_id", UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True),
)

company_categories = Table(
    "company_categories",
    Base.metadata,
    Column("company_id", UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)
