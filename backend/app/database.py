from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import structlog

logger = structlog.get_logger()


# ============================
# SQLAlchemy 2.0 Async 엔진
# ============================
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ============================
# Base 모델 (모든 ORM 모델의 부모)
# ============================
class Base(DeclarativeBase):
    pass


# ============================
# 의존성 주입용 DB 세션
# ============================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================
# 컨텍스트 매니저용 (배치 작업)
# ============================
@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """데이터베이스 테이블 생성 (필요 시)"""
    from app.vector_store import VectorItem  # Ensure model is registered
    from app.models.user import User
    from app.models.order import Order
    from app.models.newspaper import Newspaper
    
    async with engine.begin() as conn:
        try:
            # 테이블 생성
            await conn.run_sync(Base.metadata.create_all)
            logger.info("database_tables_created_successfully")
        except Exception as e:
            logger.error("database_init_failed", error=str(e))
            raise
