"""primary_category

Revision ID: dc0b5e388706
Revises: 
Create Date: 2025-08-14 15:49:58.065547

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'dc0b5e388706'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "companies",
        sa.Column(
            "primary_category_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_companies_primary_category_id",
        "companies",
        ["primary_category_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_companies_primary_category",
        "companies",
        "categories",
        ["primary_category_id"],
        ["id"],
        ondelete="SET NULL",
    )

def downgrade():
    op.drop_constraint("fk_companies_primary_category", "companies", type_="foreignkey")
    op.drop_index("ix_companies_primary_category_id", table_name="companies")
    op.drop_column("companies", "primary_category_id")