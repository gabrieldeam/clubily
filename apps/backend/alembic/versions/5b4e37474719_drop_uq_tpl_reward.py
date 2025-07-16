"""drop uq_tpl_reward

Revision ID: 5b4e37474719
Revises: 02fa15d4c52b
Create Date: 2025-07-16 13:55:50.030997

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b4e37474719'
down_revision: Union[str, None] = '02fa15d4c52b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # remove a restrição de unicidade (template_id, reward_id)
    op.drop_constraint('uq_tpl_reward', 'template_reward_links', type_='unique')

def downgrade() -> None:
    """Downgrade schema."""
    # recria a restrição de unicidade caso precise reverter
    op.create_unique_constraint(
        'uq_tpl_reward',
        'template_reward_links',
        ['template_id', 'reward_id']
    )