"""user_points_stats table and triggr

Revision ID: 2a19f78ab547
Revises: e781b21442f9
Create Date: 2025-07-04 19:44:49.216697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a19f78ab547'
down_revision: Union[str, None] = 'e781b21442f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
