"""user_points_stats table and trigger vs

Revision ID: 4ede0ac1c1c3
Revises: 2a19f78ab547
Create Date: 2025-07-04 19:45:37.420927

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4ede0ac1c1c3'
down_revision: Union[str, None] = '2a19f78ab547'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "user_points_stats",
        sa.Column("user_id",  postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lifetime_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("today_points",    sa.Integer(), nullable=False, server_default="0"),
        sa.Column("month_points",    sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"),
                  nullable=False),
    )

    # ---- gatilho PL/pgSQL ---------------------------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION inc_points_stats() RETURNS trigger AS $$
        DECLARE
            today_start  timestamptz := date_trunc('day',  NEW.created_at);
            month_start  timestamptz := date_trunc('month', NEW.created_at);
        BEGIN
            IF NEW.type = 'award' THEN
                INSERT INTO user_points_stats AS s (user_id,
                                                    lifetime_points,
                                                    today_points,
                                                    month_points)
                VALUES (NEW.user_id, NEW.amount, NEW.amount, NEW.amount)
                ON CONFLICT (user_id) DO UPDATE
                  SET lifetime_points = s.lifetime_points + EXCLUDED.lifetime_points,
                      today_points    = CASE
                                            WHEN date_trunc('day',    s.updated_at) = today_start
                                            THEN s.today_points + EXCLUDED.today_points
                                            ELSE EXCLUDED.today_points
                                        END,
                      month_points    = CASE
                                            WHEN date_trunc('month',  s.updated_at) = month_start
                                            THEN s.month_points + EXCLUDED.month_points
                                            ELSE EXCLUDED.month_points
                                        END,
                      updated_at      = now();
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_inc_points_stats
            AFTER INSERT ON user_points_transactions
            FOR EACH ROW EXECUTE PROCEDURE inc_points_stats();
        """
    )


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_inc_points_stats ON user_points_transactions;")
    op.execute("DROP FUNCTION IF EXISTS inc_points_stats();")
    op.drop_table("user_points_stats")