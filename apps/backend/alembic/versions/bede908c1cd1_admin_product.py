"""admin product

Revision ID: bede908c1cd1
Revises: a0d86d358405
Create Date: 2025-07-04 21:36:04.175406

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bede908c1cd1'
down_revision: Union[str, None] = 'a0d86d358405'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
