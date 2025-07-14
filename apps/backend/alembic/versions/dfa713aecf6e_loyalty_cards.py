"""loyalty cards

Revision ID: dfa713aecf6e
Revises: 425bfb4ec4d9
Create Date: 2025-07-13 13:24:25.997083
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# Se você quiser usar UUIDs gerados pelo Postgres em vez de pelo Python,
# descomente isto (assegure-se de ter a extensão pgcrypto instalada):
# op.execute("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";")

# revision identifiers, used by Alembic.
revision: str = 'dfa713aecf6e'
down_revision: Union[str, None] = '425bfb4ec4d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Templates ───────────────────────────────────────────────
    op.create_table(
        'loyalty_card_templates',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('promo_text', sa.Text(), nullable=True),
        sa.Column('stamp_total', sa.Integer(), nullable=False),
        sa.Column('reward_kind', sa.String(length=50), nullable=False),
        sa.Column('reward_desc', sa.String(length=255), nullable=False),
        sa.Column('color_primary', sa.String(length=7), nullable=True),
        sa.Column('color_bg', sa.String(length=7), nullable=True),
        sa.Column('per_user_limit', sa.Integer(), nullable=False),
        sa.Column('emission_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('emission_end',   sa.DateTime(timezone=True), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('TRUE')),
        sa.Column('stamp_icon_url', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )

    # ─── Regras de template ───────────────────────────────────────
    op.create_table(
        'loyalty_card_rules',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('template_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('loyalty_card_templates.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('rule_type', sa.String(length=50), nullable=False),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ─── Instâncias emitidas ──────────────────────────────────────
    op.create_table(
        'loyalty_card_instances',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('template_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('loyalty_card_templates.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'active'")),
        sa.Column('issued_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ─── Códigos de carimbo ───────────────────────────────────────
    op.create_table(
        'loyalty_card_codes',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('instance_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('loyalty_card_instances.id', ondelete='CASCADE'),
                  nullable=False, unique=True),
        sa.Column('code', sa.String(length=32), nullable=False, unique=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Índices adicionais (opcional):
    op.create_index('ix_loyalty_templates_company', 'loyalty_card_templates', ['company_id'])
    op.create_index('ix_loyalty_instances_user',   'loyalty_card_instances', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_loyalty_instances_user',   table_name='loyalty_card_instances')
    op.drop_index('ix_loyalty_templates_company',table_name='loyalty_card_templates')
    op.drop_table('loyalty_card_codes')
    op.drop_table('loyalty_card_instances')
    op.drop_table('loyalty_card_rules')
    op.drop_table('loyalty_card_templates')
