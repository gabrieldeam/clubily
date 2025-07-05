"""user_points_stats table and trigger

Revision ID: e7f39c01a58e
Revises: 3da810a3fca2
Create Date: 2025-07-04 19:44:13.430909

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f39c01a58e'
down_revision: Union[str, None] = '3da810a3fca2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
