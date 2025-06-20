"""Inicial

Revision ID: fd0416161aea
Revises: 
Create Date: 2025-06-16 10:55:09.918841

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd0416161aea'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('company_payments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('company_id', sa.UUID(), nullable=False),
    sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('asaas_id', sa.String(length=255), nullable=False),
    sa.Column('pix_qr_code', sa.String(), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'PAID', 'FAILED', 'CANCELLED', name='paymentstatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_company_payments_asaas_id'), 'company_payments', ['asaas_id'], unique=True)
    op.create_index(op.f('ix_company_payments_company_id'), 'company_payments', ['company_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_company_payments_company_id'), table_name='company_payments')
    op.drop_index(op.f('ix_company_payments_asaas_id'), table_name='company_payments')
    op.drop_table('company_payments')
    # ### end Alembic commands ###
