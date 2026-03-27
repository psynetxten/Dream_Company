"""add stripe fields to orders

Revision ID: a1b2c3d4e5f6
Revises: 08278ff856b1
Create Date: 2026-03-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '08278ff856b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL IF NOT EXISTS 로 안전하게 추가
    op.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(200)")
    op.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(200)")
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_orders_stripe_session_id'
            ) THEN
                ALTER TABLE orders ADD CONSTRAINT uq_orders_stripe_session_id UNIQUE (stripe_session_id);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_orders_stripe_session_id'
            ) THEN
                ALTER TABLE orders DROP CONSTRAINT uq_orders_stripe_session_id;
            END IF;
        END $$;
    """)
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS stripe_payment_intent_id")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS stripe_session_id")
