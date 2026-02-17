from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import router
import structlog

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 이벤트"""
    # 시작
    logger.info("dream_newspaper_starting", environment=settings.ENVIRONMENT)

    # ChromaDB 기업 데이터 로드 (최초 1회)
    try:
        from app.agents.sponsor_matcher.company_db_loader import load_companies_to_chromadb
        load_companies_to_chromadb()
    except Exception as e:
        logger.warning("company_db_load_failed", error=str(e))

    # 스케줄러 시작
    try:
        from app.tasks.daily_publish import setup_scheduler
        setup_scheduler()
        logger.info("scheduler_initialized")
    except Exception as e:
        logger.error("scheduler_init_failed", error=str(e))

    yield

    # 종료
    try:
        from app.tasks.daily_publish import shutdown_scheduler
        shutdown_scheduler()
    except Exception:
        pass

    logger.info("dream_newspaper_shutdown")


# ============================
# FastAPI 앱 생성
# ============================
app = FastAPI(
    title="꿈신문사 API",
    description="AI 멀티에이전트 꿈 신문 서비스 - Dream Newspaper",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ============================
# CORS 미들웨어
# ============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# 라우터 등록
# ============================
app.include_router(router)


# ============================
# 헬스체크
# ============================
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "dream-newspaper",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/")
async def root():
    return {
        "message": "꿈신문사 API에 오신 것을 환영합니다.",
        "docs": "/docs",
        "health": "/health",
    }
