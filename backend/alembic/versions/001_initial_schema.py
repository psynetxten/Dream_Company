"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================
    # UUID 확장 활성화
    # ============================
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ============================
    # users 테이블
    # ============================
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("subscription_plan", sa.String(20), nullable=True),
        sa.Column("subscription_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_users_email", "users", ["email"], unique=True)
    op.create_index("idx_users_role", "users", ["role"])

    # ============================
    # sponsors 테이블
    # ============================
    op.create_table(
        "sponsors",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("website_url", sa.String(500), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("target_roles", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("target_companies", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("target_keywords", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # ============================
    # sponsor_slots 테이블
    # ============================
    op.create_table(
        "sponsor_slots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("sponsor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slot_type", sa.String(30), nullable=False),
        sa.Column("variable_value", sa.String(200), nullable=True),
        sa.Column("purchased_quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("remaining_quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("price_per_unit", sa.Integer(), nullable=False),
        sa.Column("total_amount", sa.Integer(), nullable=False),
        sa.Column("payment_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("is_auto_matched", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("match_score", sa.Numeric(3, 2), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["sponsor_id"], ["sponsors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_sponsor_slots_sponsor_id", "sponsor_slots", ["sponsor_id"])
    op.create_index("idx_sponsor_slots_slot_type", "sponsor_slots", ["slot_type"])

    # ============================
    # orders 테이블
    # ============================
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dream_description", sa.Text(), nullable=False),
        sa.Column("protagonist_name", sa.String(100), nullable=False),
        sa.Column("target_role", sa.String(200), nullable=False),
        sa.Column("target_company", sa.String(200), nullable=True),
        sa.Column("supporting_people", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("series_theme", sa.String(200), nullable=True),
        sa.Column("future_year", sa.Integer(), nullable=False, server_default="2030"),
        sa.Column("payment_type", sa.String(20), nullable=False),
        sa.Column("payment_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("amount_krw", sa.Integer(), nullable=True),
        sa.Column("assigned_writer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("writer_type", sa.String(10), nullable=False, server_default="ai"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("publish_time", sa.Time(), nullable=False, server_default="08:00:00"),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="Asia/Seoul"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_writer_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_orders_user_id", "orders", ["user_id"])
    op.create_index("idx_orders_status", "orders", ["status"])

    # ============================
    # newspapers 테이블
    # ============================
    op.create_table(
        "newspapers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("episode_number", sa.Integer(), nullable=False),
        sa.Column("future_date", sa.Date(), nullable=False),
        sa.Column("future_date_label", sa.String(100), nullable=True),
        sa.Column("headline", sa.String(200), nullable=True),
        sa.Column("subhead", sa.String(400), nullable=True),
        sa.Column("lead_paragraph", sa.Text(), nullable=True),
        sa.Column("body_content", sa.Text(), nullable=True),
        sa.Column("sidebar_content", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("raw_content", sa.Text(), nullable=True),
        sa.Column("variables_used", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("sponsor_slot_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_model", sa.String(100), nullable=True),
        sa.Column("generation_ms", sa.Integer(), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_saved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sponsor_slot_id"], ["sponsor_slots.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", "episode_number", name="uq_newspaper_order_episode"),
    )
    op.create_index("idx_newspapers_order_id", "newspapers", ["order_id"])
    op.create_index("idx_newspapers_status", "newspapers", ["status"])
    op.create_index("idx_newspapers_scheduled_at", "newspapers", ["scheduled_at"])
    op.create_index("idx_newspapers_published_at", "newspapers", ["published_at"])

    # ============================
    # writer_profiles 테이블
    # ============================
    op.create_table(
        "writer_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pen_name", sa.String(100), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("portfolio_url", sa.String(500), nullable=True),
        sa.Column("specialties", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("max_concurrent_orders", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("current_order_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("revenue_share_pct", sa.Integer(), nullable=False, server_default="70"),
        sa.Column("total_earnings_krw", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("avg_rating", sa.Numeric(3, 2), nullable=True),
        sa.Column("total_reviews", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("use_ai_assist", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("ai_assist_level", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_writer_user_id"),
    )

    # ============================
    # publication_schedules 테이블
    # ============================
    op.create_table(
        "publication_schedules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("newspaper_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("episode_number", sa.Integer(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["newspaper_id"], ["newspapers.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", "episode_number", name="uq_schedule_order_episode"),
    )
    op.create_index("idx_pub_schedules_scheduled_at", "publication_schedules", ["scheduled_at"])
    op.create_index("idx_pub_schedules_status", "publication_schedules", ["status"])

    # ============================
    # agent_logs 테이블
    # ============================
    op.create_table(
        "agent_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("agent_type", sa.String(50), nullable=False),
        sa.Column("related_order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_newspaper_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("input_context", postgresql.JSONB(), nullable=True),
        sa.Column("output_result", postgresql.JSONB(), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=True),
        sa.Column("output_tokens", sa.Integer(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), nullable=True),
        sa.Column("error_details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["related_order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["related_newspaper_id"], ["newspapers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_agent_logs_agent_type", "agent_logs", ["agent_type"])
    op.create_index("idx_agent_logs_order_id", "agent_logs", ["related_order_id"])
    op.create_index("idx_agent_logs_created_at", "agent_logs", ["created_at"])

    # ============================
    # notifications 테이블
    # ============================
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("channel", sa.String(20), nullable=False, server_default="email"),
        sa.Column("is_sent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("agent_logs")
    op.drop_table("publication_schedules")
    op.drop_table("writer_profiles")
    op.drop_table("newspapers")
    op.drop_table("orders")
    op.drop_table("sponsor_slots")
    op.drop_table("sponsors")
    op.drop_table("users")
