"""merge reward product heads

Revision ID: 4ada4219e05a
Revises: 2ce98bd56ecb, bede908c1cd1
Create Date: 2025-07-08 15:04:10.064303

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ada4219e05a'
down_revision: Union[str, None] = ('2ce98bd56ecb', 'bede908c1cd1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
