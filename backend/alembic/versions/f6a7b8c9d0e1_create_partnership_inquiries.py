"""create partnership_inquiries table

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-07-04

스폰서 제휴 문의(/for-sponsors) 저장용 테이블. 관리자 대시보드에서 목록·상태관리.

프로덕션(Supabase)에는 Supabase MCP로 직접 선적용함. 멱등(IF NOT EXISTS)이라
어느 환경에서 돌든/이미 적용돼 있든 안전.
"""
from alembic import op

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS partnership_inquiries (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_name text NOT NULL,
            contact_name text NOT NULL,
            email text NOT NULL,
            phone text,
            message text,
            status varchar(20) NOT NULL DEFAULT 'new',
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_created_at ON partnership_inquiries (created_at DESC)")
    op.execute("ALTER TABLE partnership_inquiries ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS partnership_inquiries")
