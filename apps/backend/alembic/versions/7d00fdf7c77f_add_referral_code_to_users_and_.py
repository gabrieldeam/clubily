from alembic import op
import sqlalchemy as sa


revision = '7d00fdf7c77f'
down_revision = '3793de6fd86b'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1) adiciona o referral_code no users
    op.add_column(
        'users',
        sa.Column('referral_code', sa.String(length=10), nullable=True),
    )
    op.create_index(
        'ix_users_referral_code',
        'users',
        ['referral_code'],
        unique=True,
    )

    # 2) cria a tabela referrals
    op.create_table(
        'referrals',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('company_id', sa.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'company_id', name='uq_referrals_user_company'),
    )

def downgrade() -> None:
    # remove a tabela referrals
    op.drop_table('referrals')

    # remove o referral_code e índice
    op.drop_index('ix_users_referral_code', table_name='users')
    op.drop_column('users', 'referral_code')
