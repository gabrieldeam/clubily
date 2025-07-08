"""UserPointsTransaction

Revision ID: 2c6bb1937b0e
Revises: 237bad34b91b
Create Date: 2025-07-08 16:13:13.733871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2c6bb1937b0e'
down_revision: Union[str, None] = '237bad34b91b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column(
        "user_points_transactions",
        "company_id",
        existing_type=sa.UUID(),
        nullable=True
    )

def downgrade():
    op.alter_column(
        "user_points_transactions",
        "company_id",
        existing_type=sa.UUID(),
        nullable=False
    )