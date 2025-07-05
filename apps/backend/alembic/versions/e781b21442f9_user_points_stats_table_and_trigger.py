"""user_points_stats table and trigger

Revision ID: e781b21442f9
Revises: e7f39c01a58e
Create Date: 2025-07-04 19:44:42.162169

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e781b21442f9'
down_revision: Union[str, None] = 'e7f39c01a58e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
