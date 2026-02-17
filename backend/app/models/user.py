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
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="user", index=True
    )  # user | writer | sponsor | admin

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
