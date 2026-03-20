import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey, Numeric, func, BigInteger, JSON, Uuid, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class WriterProfile(Base):
    __tablename__ = "writer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True
    )

    pen_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # 전문 분야
    specialties: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    # 역량
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    max_concurrent_orders: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    current_order_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # 수익
    revenue_share_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    total_earnings_krw: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    # 평점
    avg_rating: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    total_reviews: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # AI 보조 설정
    use_ai_assist: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    ai_assist_level: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft"
    )  # draft | outline | none

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # 관계
    user: Mapped["User"] = relationship("User", back_populates="writer_profile")  # noqa: F821
