"""CompanyPasswordResetCode

Revision ID: 5978a016911f
Revises: 21e97c83cb2d
Create Date: 2025-07-10 13:32:33.341658

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '5978a016911f'
down_revision: Union[str, None] = '21e97c83cb2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.create_table(
        "company_password_reset_codes",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("code", sa.String(length=6), nullable=False, index=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index(
        "ix_company_reset_code",
        "company_password_reset_codes",
        ["code"],
    )


def downgrade() -> None:
    op.drop_index("ix_company_reset_code", table_name="company_password_reset_codes")
    op.drop_table("company_password_reset_codes")