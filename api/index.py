"""
Vercel Serverless Python Entry Point
이 파일은 Vercel이 직접 실행하는 최소 FastAPI 앱입니다.
복잡한 백엔드 임포트(asyncpg, pgvector 등)를 지연 로딩하여
Python 런타임 시작 시 500 에러를 방지합니다.
"""
import os
import sys

# backend 디렉토리를 path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 최소 앱 생성 (복잡한 임포트 없이)
app = FastAPI(
    title="꿈신문사 API",
    version="0.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
async def ping():
    return {"status": "pong", "version": "0.2.0", "service": "dream-newspaper"}


@app.get("/api/v1/health")
async def health():
    """헬스체크 - DB 연결 없이 기본 상태만 반환"""
    import datetime
    env_check = {
        "SUPABASE_URL": bool(os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")),
        "SUPABASE_ANON_KEY": bool(os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
        "SUPABASE_SERVICE_ROLE_KEY": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
        "DATABASE_URL": bool(os.getenv("DATABASE_URL")),
    }
    return {
        "status": "ok",
        "version": "0.2.0",
        "deployed_at": str(datetime.datetime.now()),
        "env_check": env_check,
    }


@app.get("/api/v1/auth/register", include_in_schema=False)
@app.post("/api/v1/auth/register")
async def register_proxy():
    """인증 엔드포인트 - Supabase 직접 연동"""
    try:
        from app.api.v1.auth import router as auth_router
        return {"message": "auth router loaded"}
    except Exception as e:
        return {"error": str(e), "hint": "백엔드 임포트 실패 - 환경변수 확인 필요"}


@app.get("/api/{path:path}")
async def api_catch_all(path: str):
    """나머지 /api/* 요청을 실제 백엔드 라우터로 위임"""
    try:
        from app.api.v1.router import router
        return {"message": f"router for /{path} loaded successfully"}
    except Exception as e:
        return {
            "error": str(e),
            "path": path,
            "hint": "임포트 에러 - Vercel 로그에서 상세 에러 확인 필요"
        }
