"""admin products

Revision ID: 94522d68404f
Revises: a0d86d358405
Create Date: 2025-07-04 21:37:28.176123

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94522d68404f'
down_revision: Union[str, None] = 'a0d86d358405'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
