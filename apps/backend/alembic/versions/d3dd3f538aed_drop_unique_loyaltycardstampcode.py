"""drop unique LoyaltyCardStampCode

Revision ID: d3dd3f538aed
Revises: 5b4e37474719
Create Date: 2025-07-16 14:09:46.082728

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3dd3f538aed'
down_revision: Union[str, None] = '5b4e37474719'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_constraint('loyalty_card_codes_instance_id_key', 'loyalty_card_stamp_codes', type_='unique')

def downgrade():
    op.create_unique_constraint(
        'loyalty_card_codes_instance_id_key',
        'loyalty_card_stamp_codes',
        ['instance_id']
    )
