"""add newspaper input/output token columns

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-03

토큰 사용량 실측 기록 — newspapers.input_tokens / output_tokens 추가.
(token_count는 입력+출력 합계, 이 둘은 단가가 다른 입력/출력 분리 저장용)

프로덕션(Supabase)에는 Supabase MCP로 직접 선적용함. 멱등(IF NOT EXISTS)이라
어느 환경에서 돌든/이미 적용돼 있든 안전.
"""
from alembic import op

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE newspapers ADD COLUMN IF NOT EXISTS input_tokens integer")
    op.execute("ALTER TABLE newspapers ADD COLUMN IF NOT EXISTS output_tokens integer")


def downgrade() -> None:
    op.execute("ALTER TABLE newspapers DROP COLUMN IF EXISTS output_tokens")
    op.execute("ALTER TABLE newspapers DROP COLUMN IF EXISTS input_tokens")
