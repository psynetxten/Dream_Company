import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, func, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    agent_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # orchestrator | writer | sponsor_matcher | writer_manager | scheduler

    related_order_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("orders.id"), nullable=True, index=True
    )
    related_newspaper_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("newspapers.id"), nullable=True
    )

    input_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    output_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # 성능 메트릭
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # success | error | timeout
    error_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
