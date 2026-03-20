"""
템플릿 마켓플레이스 모델

흐름: 작가가 슬롯 포함 템플릿 집필 → 마켓 등록 →
      독자가 구매 + 슬롯값 입력 → 개인화 신문 시리즈 생성
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey, func, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TemplateSeries(Base):
    """작가가 사전 집필한 신문 시리즈 템플릿"""
    __tablename__ = "template_series"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    writer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # 템플릿 메타
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    genre: Mapped[str] = mapped_column(String(50), nullable=False)
    # career | sports | arts | science | business | social | adventure
    theme: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 상품 설정
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)  # 7 | 14 | 30
    price_krw: Mapped[int] = mapped_column(Integer, nullable=False, default=9900)
    future_year: Mapped[int] = mapped_column(Integer, nullable=False, default=2030)

    # 미리보기 (구매 전 독자에게 보여줄 샘플)
    preview_headline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    preview_lead: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 상태
    # draft | listed | unlisted | suspended
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)

    # 통계
    purchase_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_revenue_krw: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # 관계
    writer: Mapped["User"] = relationship("User", foreign_keys=[writer_id])  # noqa: F821
    slots: Mapped[list["TemplateSlot"]] = relationship(
        "TemplateSlot", back_populates="template", cascade="all, delete-orphan",
        order_by="TemplateSlot.display_order"
    )
    episodes: Mapped[list["TemplateEpisode"]] = relationship(
        "TemplateEpisode", back_populates="template", cascade="all, delete-orphan",
        order_by="TemplateEpisode.episode_number"
    )
    purchases: Mapped[list["TemplatePurchase"]] = relationship(
        "TemplatePurchase", back_populates="template", cascade="all, delete-orphan"
    )


class TemplateSlot(Base):
    """
    템플릿 슬롯 정의 — 작가가 설정, 독자가 구매 시 값 입력

    슬롯 카테고리:
      identity  : 주인공, 호칭, 나이, 성별
      career    : 직업, 회사, 직책, 팀명
      achievement: 대표작, 수상명, 기록, 수치
      relationship: 멘토, 파트너, 경쟁자
      location  : 출신지, 활동지역, 무대
      brand     : 브랜드명, 제품명, 프로젝트명
      custom    : 작가가 직접 정의한 슬롯
    """
    __tablename__ = "template_slots"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("template_series.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # 슬롯 키 — 템플릿 본문에서 [주인공] 형태로 사용
    slot_key: Mapped[str] = mapped_column(String(50), nullable=False)
    # 독자에게 보여줄 라벨 ("당신의 이름은?")
    slot_label: Mapped[str] = mapped_column(String(100), nullable=False)
    # 입력 힌트 ("예: 김꿈돌")
    slot_hint: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # 카테고리
    slot_category: Mapped[str] = mapped_column(String(30), nullable=False, default="identity")
    # 필수 여부
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # 기본값 (선택 슬롯)
    default_value: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # 표시 순서
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # 관계
    template: Mapped["TemplateSeries"] = relationship("TemplateSeries", back_populates="slots")


class TemplateEpisode(Base):
    """
    템플릿의 각 에피소드 — 슬롯 포함 원고
    본문에 [주인공], [직업] 등 슬롯 태그 삽입
    """
    __tablename__ = "template_episodes"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("template_series.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    # 구매일로부터 며칠 후 발행 (0=당일, 1=다음날 ...)
    day_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # 슬롯 포함 원고 템플릿 — [주인공], [직업] 등 태그 삽입
    headline_template: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    subhead_template: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    lead_paragraph_template: Mapped[str] = mapped_column(Text, nullable=False, default="")
    body_content_template: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sidebar_template: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # 관계
    template: Mapped["TemplateSeries"] = relationship("TemplateSeries", back_populates="episodes")


class TemplatePurchase(Base):
    """
    독자의 템플릿 구매 기록 — 슬롯값 저장 + 개인화 신문 생성
    """
    __tablename__ = "template_purchases"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("template_series.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # 생성된 개인화 주문 (이 주문의 Newspaper들이 실제 발행됨)
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True
    )

    # 독자가 입력한 슬롯값 {"주인공": "김철수", "직업": "AI 엔지니어", ...}
    slot_values: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # 결제
    payment_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | paid | refunded
    amount_krw: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    merchant_uid: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)

    purchased_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # 관계
    template: Mapped["TemplateSeries"] = relationship("TemplateSeries", back_populates="purchases")
    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id])  # noqa: F821
