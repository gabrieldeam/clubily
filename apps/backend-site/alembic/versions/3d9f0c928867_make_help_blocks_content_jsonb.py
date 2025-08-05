"""Make help_blocks.content JSONB

Revision ID: 3d9f0c928867
Revises: 538aa501ad35
Create Date: 2025-08-04 14:19:47.587256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3d9f0c928867'
down_revision: Union[str, Sequence[str], None] = '538aa501ad35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "help_blocks",
        "content",
        existing_type=sa.TEXT(),
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_nullable=False,
        postgresql_using="content::jsonb"
    )


def downgrade() -> None:
    op.alter_column(
        "help_blocks",
        "content",
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        type_=sa.TEXT(),
        existing_nullable=False,
        postgresql_using="content::text"
    )