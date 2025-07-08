"""add_redeem_to_userpointstxtype

Revision ID: 237bad34b91b
Revises: 1b10e7f16a36
Create Date: 2025-07-08 16:09:19.095042

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '237bad34b91b'
down_revision: Union[str, None] = '1b10e7f16a36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: adiciona o valor 'redeem' no ENUM."""
    # Atenção: o IF NOT EXISTS só funciona no PostgreSQL 12+.
    op.execute(
        "ALTER TYPE userpointstxtype ADD VALUE IF NOT EXISTS 'redeem';"
    )


def downgrade() -> None:
    """Não implementado: remoção de valor de ENUM não é suportada."""
    # raise NotImplementedError("Downgrade não suportado para este ENUM")
    pass
