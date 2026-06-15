"""make email nullable for kakao login

Revision ID: c3d4e5f6a7b8
Revises: b2e4f6a8c0d2
Create Date: 2026-06-15

카카오 로그인 지원 — 이메일 없이 카카오 ID만으로 가입 가능하도록
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2e4f6a8c0d2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('users', 'email',
                    existing_type=sa.String(length=255),
                    nullable=True)


def downgrade() -> None:
    # 이메일이 null인 유저가 있으면 downgrade 불가 — 필요 시 수동 처리
    op.alter_column('users', 'email',
                    existing_type=sa.String(length=255),
                    nullable=False)
