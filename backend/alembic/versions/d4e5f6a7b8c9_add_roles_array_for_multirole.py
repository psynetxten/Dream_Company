"""add roles array for multi-role

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-26

멀티-role 겸직 지원 — users.role(활성 role)은 유지하고, users.roles 배열을 추가.
한 계정이 독자+작가+스폰서를 동시에 보유할 수 있게 한다.
기존 유저는 roles = [현재 role] 로 backfill.

주의: 프로덕션(Supabase Postgres)에는 Supabase MCP로 직접 적용함
(Render의 alembic upgrade가 신뢰성 있게 실행되지 않는 이슈 — project_render_migration_risk).
따라서 멱등(IF NOT EXISTS)하게 작성해 어느 환경에서 돌아도/이미 적용돼 있어도 안전하다.
"""
from alembic import op

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 멱등: 이미 존재하면 no-op
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS roles varchar[] NOT NULL DEFAULT '{}'")
    # 기존 유저 backfill: roles = [현재 활성 role]
    op.execute("UPDATE users SET roles = ARRAY[role] WHERE roles = '{}' OR roles IS NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS roles")
