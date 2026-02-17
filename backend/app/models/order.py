import uuid
from datetime import datetime, time
from sqlalchemy import String, Integer, Boolean, DateTime, Time, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # 꿈 내용 (핵심 변수들)
    dream_description: Mapped[str] = mapped_column(Text, nullable=False)
    protagonist_name: Mapped[str] = mapped_column(String(100), nullable=False)
    target_role: Mapped[str] = mapped_column(String(200), nullable=False)
    target_company: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # 주변인 변수 (확장용)
    # [{"name": "김민준", "relation": "멘토", "company": "삼성"}]
    supporting_people: Mapped[dict] = mapped_column(JSONB, default=list, nullable=False)

    # 상품 설정
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)  # 7 | 14 | 30
    series_theme: Mapped[str | None] = mapped_column(String(200), nullable=True)
    future_year: Mapped[int] = mapped_column(Integer, nullable=False, default=2030)

    # 결제 정보
    payment_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # subscription | one_time
    payment_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | paid | refunded | failed
    amount_krw: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 작가 배정
    assigned_writer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    writer_type: Mapped[str] = mapped_column(
        String(10), nullable=False, default="ai"
    )  # ai | human

    # 진행 상태
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", index=True
    )  # draft | active | paused | completed | cancelled

    # 발행 설정
    publish_time: Mapped[time] = mapped_column(Time, nullable=False, default=time(8, 0))
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="Asia/Seoul")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # 관계
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="orders", foreign_keys=[user_id]
    )
    newspapers: Mapped[list["Newspaper"]] = relationship(  # noqa: F821
        "Newspaper", back_populates="order", cascade="all, delete-orphan"
    )
    schedules: Mapped[list["PublicationSchedule"]] = relationship(  # noqa: F821
        "PublicationSchedule", back_populates="order", cascade="all, delete-orphan"
    )
