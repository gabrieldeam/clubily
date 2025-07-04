"""add FK company to user_points_transactions

Revision ID: 3da810a3fca2
Revises: 5495a41cbed8
Create Date: 2025-07-04 14:16:25.256134

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3da810a3fca2'
down_revision: Union[str, None] = '5495a41cbed8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
