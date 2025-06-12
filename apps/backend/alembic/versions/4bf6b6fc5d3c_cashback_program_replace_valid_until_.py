"""cashback_program: replace valid_until with validity_days

Revision ID: 4bf6b6fc5d3c
Revises: 7ffba82caf4e
Create Date: 2025-06-11 16:27:12.936433

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '4bf6b6fc5d3c'
down_revision = '7ffba82caf4e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) adiciona coluna validity_days, com default temporário de 30
    op.add_column(
        'cashback_programs',
        sa.Column(
            'validity_days',
            sa.Integer(),
            nullable=False,
            server_default='30',
        )
    )
    # 2) backfill: converte existing valid_until → days de diferença (em dias inteiros)
    op.execute(
        """
        UPDATE cashback_programs
        SET validity_days =
            FLOOR(EXTRACT(EPOCH FROM (valid_until - created_at)) / 86400)
        """
    )
    # 3) remove o default agora que já foi aplicado
    op.alter_column(
        'cashback_programs',
        'validity_days',
        server_default=None
    )
    # 4) descarta a coluna antiga
    op.drop_column('cashback_programs', 'valid_until')


def downgrade() -> None:
    # 1) adiciona de volta a coluna valid_until (temporariamente nullable)
    op.add_column(
        'cashback_programs',
        sa.Column(
            'valid_until',
            sa.DateTime(timezone=True),
            nullable=True,
        )
    )
    # 2) backfill: recria valid_until a partir de created_at + validity_days
    op.execute(
        """
        UPDATE cashback_programs
        SET valid_until = created_at + (validity_days * INTERVAL '1 day')
        """
    )
    # 3) torna a coluna não-null novamente
    op.alter_column(
        'cashback_programs',
        'valid_until',
        nullable=False
    )
    # 4) remove a coluna validity_days
    op.drop_column('cashback_programs', 'validity_days')
