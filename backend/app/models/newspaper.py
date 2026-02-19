import uuid
from datetime import datetime, date
from sqlalchemy import String, Integer, Boolean, DateTime, Date, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Newspaper(Base):
    __tablename__ = "newspapers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # 에피소드 정보
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    future_date: Mapped[date] = mapped_column(Date, nullable=False)
    future_date_label: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # "2030년 3월 15일 화요일"

    # 콘텐츠 (구조화)
    headline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    subhead: Mapped[str | None] = mapped_column(String(400), nullable=True)
    lead_paragraph: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    # {"quote": "...", "stats": [{"label": "성장률", "value": "143%"}]}
    sidebar_content: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # 메타데이터
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    # {"protagonist": "김철수", "company": "카카오", "sponsor": "삼성SDS"}
    variables_used: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # 스폰서 연결
    sponsor_slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sponsor_slots.id"), nullable=True
    )

    # 발행 상태
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", index=True
    )  # draft | review | published | failed
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # AI 생성 메타
    ai_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    generation_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 신규 추가: 마케팅 및 콘텐츠 에셋
    sns_copy: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False) # 마케팅 팀장 제작
    visual_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)     # 콘텐츠 디렉터 제작

    # 사용자 반응
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_saved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # 관계
    order: Mapped["Order"] = relationship("Order", back_populates="newspapers")  # noqa: F821
    sponsor_slot: Mapped["SponsorSlot | None"] = relationship(  # noqa: F821
        "SponsorSlot", back_populates="newspapers"
    )

    __table_args__ = (
        # 한 의뢰에서 에피소드 번호는 유일
        {"schema": None},
    )
