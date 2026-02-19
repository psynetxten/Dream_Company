from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import router
import structlog

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 이벤트 (Vercel Serverless 호환)"""
    logger.info("dream_newspaper_starting", environment=settings.ENVIRONMENT)
    
    # Supabase pgvector 및 테이블 초기화는 이제 수동 또는 별도 마이그레이션 스크립트로 관리합니다.
    # 서버리스 환경 특성상 매 시작 시 대규모 로딩은 피합니다.

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
