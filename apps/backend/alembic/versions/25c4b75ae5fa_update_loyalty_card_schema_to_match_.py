"""update loyalty-card schema to match models

Revision ID: 25c4b75ae5fa
Revises: dfa713aecf6e
Create Date: 2025-07-13 15:34:39.200130

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '25c4b75ae5fa'
down_revision: Union[str, None] = 'dfa713aecf6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── loyalty_card_rules: add `order` and `active` ─────────────
    op.add_column(
        'loyalty_card_rules',
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
    )
    op.add_column(
        'loyalty_card_rules',
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('TRUE')),
    )
    # limpa server_default
    op.alter_column('loyalty_card_rules', 'order', server_default=None)
    op.alter_column('loyalty_card_rules', 'active', server_default=None)

    # ── loyalty_card_instances: remove `status`, add stamps & dates ─
    op.drop_column('loyalty_card_instances', 'status')

    op.add_column(
        'loyalty_card_instances',
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'loyalty_card_instances',
        sa.Column('stamps_given', sa.Integer(), nullable=False, server_default='0'),
    )
    op.add_column(
        'loyalty_card_instances',
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'loyalty_card_instances',
        sa.Column('reward_claimed', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
    )
    # unique(template_id, user_id)
    op.create_unique_constraint(
        'uq_template_user', 'loyalty_card_instances', ['template_id', 'user_id']
    )
    # limpa server_default
    op.alter_column('loyalty_card_instances', 'stamps_given', server_default=None)
    op.alter_column('loyalty_card_instances', 'reward_claimed', server_default=None)

    # ── create loyalty_card_stamps ────────────────────────────────
    op.create_table(
        'loyalty_card_stamps',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('instance_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('loyalty_card_instances.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('stamp_no', sa.Integer(), nullable=False),
        sa.Column('given_by_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'),
                  nullable=True),
        sa.Column('given_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── rename loyalty_card_codes → loyalty_card_stamp_codes ───────
    op.rename_table('loyalty_card_codes', 'loyalty_card_stamp_codes')

    # drop created_at col (não usado no modelo)
    op.drop_column('loyalty_card_stamp_codes', 'created_at')

    # ajusta tamanho de code e adiciona campo used
    op.alter_column(
        'loyalty_card_stamp_codes', 'code',
        type_=sa.String(length=12),
        existing_type=sa.String(length=32),
    )
    op.add_column(
        'loyalty_card_stamp_codes',
        sa.Column('used', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
    )
    op.alter_column('loyalty_card_stamp_codes', 'used', server_default=None)


def downgrade() -> None:
    # rollback na ordem inversa

    # rename de volta e recria created_at, código longo
    op.alter_column(
        'loyalty_card_stamp_codes', 'code',
        type_=sa.String(length=32),
        existing_type=sa.String(length=12),
    )
    op.add_column(
        'loyalty_card_stamp_codes',
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.drop_column('loyalty_card_stamp_codes', 'used')
    op.rename_table('loyalty_card_stamp_codes', 'loyalty_card_codes')

    # drop stamps
    op.drop_table('loyalty_card_stamps')

    # loyalty_card_instances: desfaz colunas e unique
    op.drop_constraint('uq_template_user', 'loyalty_card_instances', type_='unique')
    op.drop_column('loyalty_card_instances', 'reward_claimed')
    op.drop_column('loyalty_card_instances', 'completed_at')
    op.drop_column('loyalty_card_instances', 'stamps_given')
    op.drop_column('loyalty_card_instances', 'expires_at')
    op.add_column(
        'loyalty_card_instances',
        sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'active'"))
    )

    # loyalty_card_rules: remove order+active
    op.drop_column('loyalty_card_rules', 'active')
    op.drop_column('loyalty_card_rules', 'order')