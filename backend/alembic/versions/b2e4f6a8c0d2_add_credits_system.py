"""add credits system

Revision ID: b2e4f6a8c0d2
Revises: a1b2c3d4e5f6
Create Date: 2026-05-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2e4f6a8c0d2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users 테이블에 credits 컬럼 추가
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0")

    # credit_transactions 테이블 생성
    op.execute("""
        CREATE TABLE IF NOT EXISTS credit_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL,
            amount INTEGER NOT NULL,
            credits_before INTEGER NOT NULL,
            credits_after INTEGER NOT NULL,
            description VARCHAR(255) NOT NULL DEFAULT '',
            order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
            stripe_session_id VARCHAR(200),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_credit_transactions_user_id ON credit_transactions(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_credit_transactions_created_at ON credit_transactions(created_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS credit_transactions")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS credits")
