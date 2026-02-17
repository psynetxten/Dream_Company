from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ============================
    # AI API
    # ============================
    ANTHROPIC_API_KEY: str

    # ============================
    # 보안
    # ============================
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ============================
    # 데이터베이스
    # ============================
    DATABASE_URL: str = "postgresql+asyncpg://dream:dream_secret@localhost:5432/dream_newspaper"

    # ============================
    # ChromaDB
    # ============================
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_AUTH_TOKEN: str = ""

    # ============================
    # 앱 설정
    # ============================
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000"]'

    @property
    def cors_origins(self) -> List[str]:
        try:
            return json.loads(self.BACKEND_CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000"]

    # ============================
    # AI 모델 설정
    # ============================
    ORCHESTRATOR_MODEL: str = "claude-sonnet-4-5-20250929"
    WRITER_MODEL: str = "claude-haiku-4-5-20251001"
    SPONSOR_MODEL: str = "claude-haiku-4-5-20251001"
    MAX_CONCURRENT_GENERATIONS: int = 5

    # ============================
    # 스케줄러 설정
    # ============================
    PUBLISH_HOUR: int = 8
    PUBLISH_MINUTE: int = 0
    PUBLISH_TIMEZONE: str = "Asia/Seoul"


settings = Settings()
