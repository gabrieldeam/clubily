"""drop unique constraint on inventory_items.sku

Revision ID: 28260489c4f2
Revises: 2c6bb1937b0e
Create Date: 2025-07-10 11:57:23.271293

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '28260489c4f2'
down_revision = '2c6bb1937b0e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # remove a uniq constraint que existia no campo sku
    op.drop_constraint(
        'inventory_items_sku_key',  # nome da constraint
        'inventory_items',
        type_='unique'
    )


def downgrade() -> None:
    # se precisar voltar atrás, recria a constraint
    op.create_unique_constraint(
        'inventory_items_sku_key',
        'inventory_items',
        ['sku']
    )
