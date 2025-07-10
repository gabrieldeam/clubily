"""PasswordResetCode

Revision ID: 21e97c83cb2d
Revises: 28260489c4f2
Create Date: 2025-07-10 13:18:14.152052
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '21e97c83cb2d'
down_revision: Union[str, None] = '28260489c4f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Cria tabela para códigos de redefinição de senha (6 dígitos)."""
    # Se estiver usando PostgreSQL e ainda não tiver a extensão para gerar UUIDs
    # você pode habilitar aqui (descomente se precisar):
    # op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    op.create_table(
        "password_reset_codes",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            # server_default=sa.text("uuid_generate_v4()")  # só se usar extensão uuid-ossp
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False
        ),
        sa.Column("code", sa.String(length=6), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column(
            "used",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false")   # inicia como False
        ),
    )

    # Índice para busca rápida pelo código (não único, pois pode colidir em usuários diferentes)
    op.create_index(
        "ix_password_reset_codes_code",
        "password_reset_codes",
        ["code"]
    )


def downgrade() -> None:
    """Reverte criação da tabela."""
    op.drop_index("ix_password_reset_codes_code", table_name="password_reset_codes")
    op.drop_table("password_reset_codes")
