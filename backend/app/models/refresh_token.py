import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    # JWT ID (JTI) - 토큰 고유 식별자 (Rotation 및 Revocation 확인용)
    token_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    
    # 보안 정보를 위한 선택적 필드
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True) # IPv6 대응
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    # 관계
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens") # noqa: F821
