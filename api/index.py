"""
Vercel Serverless Python Entry Point — 꿈신문사 API v0.2.1
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx

app = FastAPI(
    title="꿈신문사 API",
    version="0.2.1",
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


def get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")

def get_supabase_anon_key() -> str:
    return os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

def get_supabase_service_key() -> str:
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


# ──────────────────────────
# Ping / 헬스체크
# ──────────────────────────
@app.get("/api/ping")
async def ping():
    return {"status": "pong", "version": "0.2.1", "service": "dream-newspaper"}


@app.get("/api/v1/health")
async def health():
    import datetime
    return {
        "status": "ok",
        "version": "0.2.1",
        "deployed_at": str(datetime.datetime.now()),
        "env_check": {
            "SUPABASE_URL": bool(get_supabase_url()),
            "SUPABASE_ANON_KEY": bool(get_supabase_anon_key()),
            "SUPABASE_SERVICE_ROLE_KEY": bool(get_supabase_service_key()),
            "DATABASE_URL": bool(os.getenv("DATABASE_URL")),
        },
    }


# ──────────────────────────
# Auth 스키마
# ──────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str


# ──────────────────────────
# 회원가입 — Supabase Admin API
# ──────────────────────────
@app.post("/api/v1/auth/register")
async def register(body: RegisterRequest):
    supabase_url = get_supabase_url()
    service_key = get_supabase_service_key()

    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=500,
            detail="서버 환경변수 미설정: SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY"
        )

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{supabase_url}/auth/v1/admin/users",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            },
            json={
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {"full_name": body.full_name},
            },
        )

    if resp.status_code in (200, 201):
        data = resp.json()
        return {
            "message": "회원가입이 완료되었습니다.",
            "user_id": data.get("id"),
            "email": data.get("email"),
        }
    elif resp.status_code == 422:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    else:
        error = resp.json()
        raise HTTPException(
            status_code=resp.status_code,
            detail=error.get("msg") or error.get("message") or "회원가입 실패"
        )


# ──────────────────────────
# 로그인 — Supabase Auth API
# ──────────────────────────
@app.post("/api/v1/auth/login")
async def login(body: LoginRequest):
    supabase_url = get_supabase_url()
    anon_key = get_supabase_anon_key()

    if not supabase_url or not anon_key:
        raise HTTPException(
            status_code=500,
            detail="서버 환경변수 미설정: SUPABASE_URL 또는 SUPABASE_ANON_KEY"
        )

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            headers={
                "apikey": anon_key,
                "Content-Type": "application/json",
            },
            json={"email": body.email, "password": body.password},
        )

    if resp.status_code == 200:
        data = resp.json()
        return {
            "access_token": data.get("access_token"),
            "refresh_token": data.get("refresh_token"),
            "user": data.get("user"),
        }
    else:
        error = resp.json()
        raise HTTPException(
            status_code=401,
            detail=error.get("error_description") or error.get("msg") or "이메일 또는 비밀번호가 올바르지 않습니다."
        )


# ──────────────────────────
# Fallback
# ──────────────────────────
@app.api_route("/api/v1/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def api_v1_fallback(path: str, request: Request):
    return JSONResponse(
        status_code=404,
        content={"detail": f"/api/v1/{path} 엔드포인트가 아직 구현되지 않았습니다."}
    )
