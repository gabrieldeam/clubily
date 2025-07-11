"""points in plans

Revision ID: a43cea17cb6e
Revises: b1e71c231e72
Create Date: 2025-06-30 13:36:38.793738

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a43cea17cb6e'
down_revision: Union[str, None] = 'b1e71c231e72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('point_plans', sa.Column('points', sa.Integer(), nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('point_plans', 'points')
    # ### end Alembic commands ###
