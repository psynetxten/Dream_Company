"""
꿈신문사 백엔드 테스트 설정
- 실제 Docker DB(localhost:5432)에 연결
- 테스트 유저 자동 생성/정리
- FastAPI TestClient (httpx AsyncClient) 제공
"""
import os
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# 테스트 환경 설정 (실제 앱 임포트 전에 설정)
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://dream:dream_secret@localhost:5432/dream_newspaper")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("DEBUG", "false")

from app.main import app


# ─── 테스트용 고정 계정 ───────────────────────────
TEST_EMAIL = f"testuser_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "testpass1234!"
TEST_NAME = "테스트유저"


@pytest_asyncio.fixture(scope="session")
async def client():
    """세션 전체에서 공유하는 AsyncClient"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac


@pytest_asyncio.fixture(scope="session")
async def test_user_token(client: AsyncClient):
    """테스트 유저 생성 후 JWT 토큰 반환 (register → login)"""
    # 1. 회원가입 (UserResponse 반환 — 토큰 없음)
    await client.post("/api/v1/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "full_name": TEST_NAME,
    })

    # 2. 로그인으로 access_token 획득
    resp = await client.post("/api/v1/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    assert resp.status_code == 200, f"테스트 유저 로그인 실패: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(test_user_token: str):
    """인증 헤더"""
    return {"Authorization": f"Bearer {test_user_token}"}
