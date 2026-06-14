"""
인증 API 테스트
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET  /api/v1/auth/me
"""
import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        """신규 유저 회원가입 성공 → UserResponse 반환"""
        email = f"new_{uuid.uuid4().hex[:8]}@test.com"
        resp = await client.post("/api/v1/auth/register", json={
            "email": email,
            "password": "password123!",
            "full_name": "신규유저",
        })
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert "id" in data
        assert data["email"] == email
        assert "role" in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user_token: str):
        """중복 이메일로 가입 시 400 반환 (Supabase 에러)"""
        from tests.conftest import TEST_EMAIL, TEST_PASSWORD, TEST_NAME
        resp = await client.post("/api/v1/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": TEST_NAME,
        })
        assert resp.status_code == 400

    async def test_register_invalid_email(self, client: AsyncClient):
        """잘못된 이메일 형식 → 422"""
        resp = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "password123!",
            "full_name": "테스트",
        })
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        """올바른 자격증명으로 로그인 성공"""
        from tests.conftest import TEST_EMAIL, TEST_PASSWORD
        resp = await client.post("/api/v1/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client: AsyncClient):
        """틀린 비밀번호 → 401"""
        from tests.conftest import TEST_EMAIL
        resp = await client.post("/api/v1/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword!",
        })
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """존재하지 않는 이메일 → 401"""
        resp = await client.post("/api/v1/auth/login", json={
            "email": "nobody@nowhere.com",
            "password": "somepassword!",
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestMe:
    async def test_me_authenticated(self, client: AsyncClient, auth_headers: dict):
        """인증된 유저의 /me 조회"""
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "email" in data
        assert "role" in data
        assert data["role"] in ("user", "writer", "sponsor", "admin")

    async def test_me_unauthenticated(self, client: AsyncClient):
        """인증 없이 /me 접근 → 401/403"""
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)

    async def test_me_invalid_token(self, client: AsyncClient):
        """유효하지 않은 토큰 → 401/403"""
        resp = await client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer invalid.token.here"
        })
        assert resp.status_code in (401, 403)
