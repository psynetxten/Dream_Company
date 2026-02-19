import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    # 소셜 로그인 유저는 비밀번호가 없을 수 있음
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="user", index=True
    )  # user | writer | sponsor | admin

    # 소셜 로그인 제공자 정보
    oauth_provider: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True) # kakao | google | naver
    oauth_provider_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # 멀티테넌시(Sponsor)를 위한 조직 ID
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 구독 정보
    subscription_plan: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # monthly | yearly | None
    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # 관계
    orders: Mapped[list["Order"]] = relationship(  # noqa: F821
        "Order", back_populates="user", foreign_keys="Order.user_id"
    )
    writer_profile: Mapped["WriterProfile | None"] = relationship(  # noqa: F821
        "WriterProfile", back_populates="user", uselist=False
    )
    sponsor: Mapped["Sponsor | None"] = relationship(  # noqa: F821
        "Sponsor", back_populates="user", uselist=False
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
