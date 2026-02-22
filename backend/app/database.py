from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import structlog

logger = structlog.get_logger()


# ============================
# SQLAlchemy 2.0 Async 엔진 (Lazy Init)
# ============================
_engine = None
_session_factory = None

def _get_db_url() -> str:
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return db_url

def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            _get_db_url(),
            echo=settings.DEBUG,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
    return _engine

def _get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            _get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory

# 하위 호환성을 위한 properties
@property
def engine_prop(self):
    return _get_engine()

engine = type('_LazyEngine', (), {'__getattr__': lambda self, n: getattr(_get_engine(), n)})()
AsyncSessionLocal = type('_LazySession', (), {'__call__': lambda self, **kw: _get_session_factory()(**kw), '__aenter__': lambda self: _get_session_factory().__aenter__()})()


# ============================
# Base 모델 (모든 ORM 모델의 부모)
# ============================
class Base(DeclarativeBase):
    pass


# ============================
# 의존성 주입용 DB 세션
# ============================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with _get_session_factory()() as session:
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
    async with _get_session_factory()() as session:
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
