"""merge reward_store + admin_products

Revision ID: 0eb07777de4b
Revises: 219db9e4d5f5, 94522d68404f
Create Date: 2025-07-04 21:53:46.762131

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0eb07777de4b'
down_revision: Union[str, None] = ('219db9e4d5f5', '94522d68404f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
