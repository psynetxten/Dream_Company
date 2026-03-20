import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey, Numeric, func, JSON, Uuid, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Sponsor(Base):
    __tablename__ = "sponsors"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # 타겟팅 설정 (배열)
    target_roles: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    target_companies: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )
    target_keywords: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # 관계
    user: Mapped["User"] = relationship("User", back_populates="sponsor")  # noqa: F821
    slots: Mapped[list["SponsorSlot"]] = relationship(
        "SponsorSlot", back_populates="sponsor", cascade="all, delete-orphan"
    )


class SponsorSlot(Base):
    __tablename__ = "sponsor_slots"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    sponsor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("sponsors.id"), nullable=False, index=True
    )

    # 슬롯 타입: company_name | brand_name | banner | sidebar
    slot_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    variable_value: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )  # 실제 삽입될 텍스트

    # 구매 수량
    purchased_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    remaining_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # 결제
    price_per_unit: Mapped[int] = mapped_column(Integer, nullable=False)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    payment_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | paid | refunded

    # AI 자동 매칭
    is_auto_matched: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    match_score: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)

    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # 관계
    sponsor: Mapped["Sponsor"] = relationship("Sponsor", back_populates="slots")
    newspapers: Mapped[list["Newspaper"]] = relationship(  # noqa: F821
        "Newspaper", back_populates="sponsor_slot"
    )
