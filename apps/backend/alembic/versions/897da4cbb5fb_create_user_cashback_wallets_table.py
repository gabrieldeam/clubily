"""create user_cashback_wallets table

Revision ID: 897da4cbb5fb
Revises: 72f6c55f458d
Create Date: 2025-06-24 21:57:24.282677

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '897da4cbb5fb'
down_revision: Union[str, None] = '72f6c55f458d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user_cashback_wallets',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'company_id', name='uq_user_company_wallet')
    )
    op.create_index(op.f('ix_user_cashback_wallets_company_id'), 'user_cashback_wallets', ['company_id'], unique=False)
    op.create_index(op.f('ix_user_cashback_wallets_user_id'), 'user_cashback_wallets', ['user_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_user_cashback_wallets_user_id'), table_name='user_cashback_wallets')
    op.drop_index(op.f('ix_user_cashback_wallets_company_id'), table_name='user_cashback_wallets')
    op.drop_table('user_cashback_wallets')
    # ### end Alembic commands ###
