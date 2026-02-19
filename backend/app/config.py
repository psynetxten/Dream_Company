from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow", # Allow Supabase keys from env
    )

    # ============================
    # AI API
    # ============================
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""

    # ============================
    # 보안
    # ============================
    SECRET_KEY: str = "migration_placeholder_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

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
    BACKEND_URL: str = "http://localhost:8000"
    
    # Supabase (Zero Cost Pivot) - Allow prefixes for Vercel harmony
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = ""

    SUPABASE_SERVICE_ROLE_KEY: str = "" # Backend only
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000"]'

    @property
    def is_production(self) -> bool:
        import os
        return self.ENVIRONMENT == "production" or os.getenv("VERCEL_ENV") == "production"

    @property
    def supabase_url(self) -> str:
        return self.SUPABASE_URL or self.NEXT_PUBLIC_SUPABASE_URL

    @property
    def supabase_anon_key(self) -> str:
        return self.SUPABASE_ANON_KEY or self.NEXT_PUBLIC_SUPABASE_ANON_KEY

    @property
    def cors_origins(self) -> List[str]:
        try:
            origins = json.loads(self.BACKEND_CORS_ORIGINS)
            # Add dynamic Vercel origins
            if self.is_production:
                origins.append("https://dream-newspaper-phi.vercel.app")
                origins.append("https://dream-newspaper.vercel.app")
            return origins
        except Exception:
            return ["http://localhost:3000", "https://dream-newspaper-phi.vercel.app"]

    # ============================
    # AI 모델 설정
    # ============================
    ORCHESTRATOR_MODEL: str = "gemini-pro-latest"
    WRITER_MODEL: str = "gemini-flash-latest"
    SPONSOR_MODEL: str = "gemini-flash-latest"
    MAX_CONCURRENT_GENERATIONS: int = 5

    # ============================
    # 스케줄러 설정
    # ============================
    PUBLISH_HOUR: int = 8
    PUBLISH_MINUTE: int = 0
    PUBLISH_TIMEZONE: str = "Asia/Seoul"

    # ============================
    # 소셜 로그인 (OAuth)
    # ============================
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""


settings = Settings()
