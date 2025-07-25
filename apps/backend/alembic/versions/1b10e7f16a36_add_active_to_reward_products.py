"""add active to reward_products

Revision ID: 1b10e7f16a36
Revises: 4ada4219e05a
Create Date: 2025-07-08 15:06:21.101416

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b10e7f16a36'
down_revision: Union[str, None] = '4ada4219e05a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('reward_products', sa.Column('active', sa.Boolean(), server_default='true', nullable=False))
    op.create_index(op.f('ix_reward_products_active'), 'reward_products', ['active'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_reward_products_active'), table_name='reward_products')
    op.drop_column('reward_products', 'active')
    # ### end Alembic commands ###
