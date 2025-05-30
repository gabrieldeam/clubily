"""Add CNPJ, address and Category

Revision ID: fbd8f04a7a8e
Revises: 3c44ab99ae5a
Create Date: 2025-05-11 15:55:59.855229

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fbd8f04a7a8e'
down_revision: Union[str, None] = '3c44ab99ae5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('categories',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('image_url', sa.String(length=255), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)
    op.create_table('company_categories',
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('company_id', 'category_id')
    )
    op.add_column('companies', sa.Column('cnpj', sa.String(length=14), nullable=False))
    op.add_column('companies', sa.Column('street', sa.String(length=255), nullable=False))
    op.add_column('companies', sa.Column('city', sa.String(length=100), nullable=False))
    op.add_column('companies', sa.Column('state', sa.String(length=100), nullable=False))
    op.add_column('companies', sa.Column('postal_code', sa.String(length=20), nullable=False))
    op.create_index(op.f('ix_companies_cnpj'), 'companies', ['cnpj'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_companies_cnpj'), table_name='companies')
    op.drop_column('companies', 'postal_code')
    op.drop_column('companies', 'state')
    op.drop_column('companies', 'city')
    op.drop_column('companies', 'street')
    op.drop_column('companies', 'cnpj')
    op.drop_table('company_categories')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_table('categories')
    # ### end Alembic commands ###
