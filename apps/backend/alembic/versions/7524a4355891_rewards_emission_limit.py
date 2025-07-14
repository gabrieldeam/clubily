"""rewards + emission_limit

Revision ID: 7524a4355891
Revises: 25c4b75ae5fa
Create Date: 2025-07-13 19:48:50.651719
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# ────────────────────────────────────────────────────────────────
revision: str = "7524a4355891"
down_revision: Union[str, None] = "25c4b75ae5fa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ruletype_enum = sa.Enum(
    "purchase_amount",
    "visit",
    "service_done",
    "product_bought",
    "category_bought",
    "custom_event",
    name="ruletype",
)


# ────────────────────────────────────────────────────────────────
def upgrade() -> None:
    bind = op.get_bind()

    # 1) Enum novo (não recria se já existir)
    ruletype_enum.create(bind, checkfirst=True)

    # 2) emission_limit no template
    op.add_column(
        "loyalty_card_templates",
        sa.Column("emission_limit", sa.Integer(), nullable=True),
    )

    # 3) Remove colunas antigas (se existirem)
    op.execute(
        """
        ALTER TABLE loyalty_card_templates
        DROP COLUMN IF EXISTS reward_kind,
        DROP COLUMN IF EXISTS reward_desc
        """
    )

    # 4) Converte rule_type de VARCHAR → enum, com cast explícito
    op.execute(
        """
        ALTER TABLE loyalty_card_rules
        ALTER COLUMN rule_type
        TYPE ruletype
        USING rule_type::text::ruletype
        """
    )

    # 5) company_rewards
    op.create_table(
        "company_rewards",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "company_id",
            sa.UUID(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,   # cria ix_company_rewards_company_id
        ),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("image_url", sa.String(length=255), nullable=True),
        sa.Column("secret", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("stock_qty", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )

    # 6) template_reward_links
    op.create_table(
        "template_reward_links",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "template_id",
            sa.UUID(),
            sa.ForeignKey("loyalty_card_templates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "reward_id",
            sa.UUID(),
            sa.ForeignKey("company_rewards.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("stamp_no", sa.Integer(), nullable=False),
        sa.UniqueConstraint("template_id", "stamp_no", name="uq_tpl_stamp"),
        sa.UniqueConstraint("template_id", "reward_id", name="uq_tpl_reward"),
    )

    # 7) reward_redemption_codes
    op.create_table(
        "reward_redemption_codes",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "link_id",
            sa.UUID(),
            sa.ForeignKey("template_reward_links.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "instance_id",
            sa.UUID(),
            sa.ForeignKey("loyalty_card_instances.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "code",
            sa.String(length=12),
            nullable=False,
            unique=True,
            index=True,      # índice será criado automaticamente
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


# ────────────────────────────────────────────────────────────────
def downgrade() -> None:
    bind = op.get_bind()

    # Tabelas de recompensa
    op.drop_table("reward_redemption_codes")
    op.drop_table("template_reward_links")
    op.drop_table("company_rewards")

    # Reverte rule_type → VARCHAR
    op.execute(
        """
        ALTER TABLE loyalty_card_rules
        ALTER COLUMN rule_type
        TYPE VARCHAR(50)
        USING rule_type::text
        """
    )

    # Remove enum
    ruletype_enum.drop(bind, checkfirst=True)

    # Recoloca colunas antigas (com default simples)
    op.add_column(
        "loyalty_card_templates",
        sa.Column("reward_kind", sa.String(length=50), server_default="", nullable=False),
    )
    op.add_column(
        "loyalty_card_templates",
        sa.Column("reward_desc", sa.String(length=255), server_default="", nullable=False),
    )

    # Remove emission_limit
    op.drop_column("loyalty_card_templates", "emission_limit")
