"""add roles array for multi-role

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-26

멀티-role 겸직 지원 — users.role(활성 role)은 유지하고, users.roles 배열을 추가.
한 계정이 독자+작가+스폰서를 동시에 보유할 수 있게 한다.
기존 유저는 roles = [현재 role] 로 backfill.
"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # roles 배열 컬럼 추가 (기본 빈 배열)
    op.add_column(
        'users',
        sa.Column('roles', sa.ARRAY(sa.String()), nullable=False, server_default='{}'),
    )
    # 기존 유저 backfill: roles = [현재 활성 role]
    op.execute("UPDATE users SET roles = ARRAY[role] WHERE roles = '{}' OR roles IS NULL")


def downgrade() -> None:
    op.drop_column('users', 'roles')
