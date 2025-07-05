"""reward store

Revision ID: 219db9e4d5f5
Revises: a0d86d358405
Create Date: 2025-07-04 21:44:00.124927

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '219db9e4d5f5'
down_revision: Union[str, None] = '94522d68404f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "reward_categories",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )
    # ... idem para reward_products, reward_product_categories, reward_orders, reward_order_items

def downgrade():
    op.drop_table("reward_order_items")
    op.drop_table("reward_orders")
    op.drop_table("reward_product_categories")
    op.drop_table("reward_products")
    op.drop_table("reward_categories")