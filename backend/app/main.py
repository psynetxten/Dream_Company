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
    logger.info("dream_newspaper_starting", environment=settings.ENVIRONMENT)

    # 스케줄러 시작 (매일 08:00 KST 자동 발행)
    try:
        from app.agents.publisher.agent import Publisher
        scheduler_agent = Publisher()
        scheduler_agent.start()
        app.state.scheduler = scheduler_agent
    except Exception as e:
        logger.error("scheduler_start_failed", error=str(e))

    yield

    # 종료
    try:
        if hasattr(app.state, "scheduler"):
            app.state.scheduler.stop()
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# 라우터 등록
# ============================
app.include_router(router)


# ============================
# 간단 ping (DB 연결 불필요)
# ============================
@app.get("/api/ping")
async def ping():
    return {"status": "pong", "version": "0.2.0", "service": "dream-newspaper"}


# ============================
# 헬스체크
# ============================
@app.get("/health")
async def health_check():
    import datetime
    import traceback
    try:
        # Check database connection (common cause of 500)
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        
        return {
            "status": "ok",
            "service": "dream-newspaper",
            "version": "0.1.2-diag",
            "deployed_at": str(datetime.datetime.now()),
            "db_connection": "ok"
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "traceback": traceback.format_exc()
        }


@app.get("/")
async def root():
    return {
        "message": "꿈신문사 API에 오신 것을 환영합니다.",
        "docs": "/docs",
        "health": "/health",
    }
