"""add_commission_to_categoriescategory

Revision ID: fae97b466809
Revises: dc0b5e388706
Create Date: 2025-08-15 15:45:50.824386

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fae97b466809'
down_revision: Union[str, None] = 'dc0b5e388706'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "categories",
        sa.Column("commission_percent", sa.Numeric(5, 2), nullable=True)
    )
    # opcional: se quiser garantir 0..100 no lado do DB (Postgres)
    op.create_check_constraint(
        "ck_categories_commission_percent_range",
        "categories",
        "commission_percent IS NULL OR (commission_percent >= 0 AND commission_percent <= 100)"
    )

def downgrade():
    op.drop_constraint("ck_categories_commission_percent_range", "categories", type_="check")
    op.drop_column("categories", "commission_percent")