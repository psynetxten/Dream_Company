"""
의뢰 API 테스트
- POST /api/v1/orders          의뢰 생성
- GET  /api/v1/orders          내 의뢰 목록
- GET  /api/v1/orders/{id}     의뢰 상세
- POST /api/v1/orders/{id}/start  의뢰 시작
"""
import uuid
import pytest
from httpx import AsyncClient

VALID_ORDER = {
    "dream_description": "구글 코리아 수석 엔지니어가 되어 AI 연구를 이끌고 싶습니다.",
    "protagonist_name": "홍길동",
    "target_role": "AI 연구소장",
    "target_company": "Google Korea",
    "duration_days": 7,
    "future_year": 2030,
    "payment_type": "free",
}


@pytest.mark.asyncio
class TestCreateOrder:
    async def test_create_order_success(self, client: AsyncClient, auth_headers: dict):
        """무료 의뢰 생성 성공"""
        resp = await client.post("/api/v1/orders", json=VALID_ORDER, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "draft"
        assert data["payment_type"] == "free"
        assert data["protagonist_name"] == "홍길동"

    async def test_create_order_unauthenticated(self, client: AsyncClient):
        """비로그인 의뢰 생성 → 401/403"""
        resp = await client.post("/api/v1/orders", json=VALID_ORDER)
        assert resp.status_code in (401, 403)

    async def test_create_order_invalid_duration(self, client: AsyncClient, auth_headers: dict):
        """pydantic ge=7 조건 위반 → 422"""
        invalid = {**VALID_ORDER, "duration_days": 5}
        resp = await client.post("/api/v1/orders", json=invalid, headers=auth_headers)
        assert resp.status_code == 422

    async def test_create_order_free_non_7days(self, client: AsyncClient, auth_headers: dict):
        """무료 플랜에 14일 → 400"""
        invalid = {**VALID_ORDER, "duration_days": 14}
        resp = await client.post("/api/v1/orders", json=invalid, headers=auth_headers)
        assert resp.status_code == 400

    async def test_create_order_short_description(self, client: AsyncClient, auth_headers: dict):
        """꿈 설명 너무 짧으면 → 422 (min_length=10)"""
        invalid = {**VALID_ORDER, "dream_description": "짧음"}
        resp = await client.post("/api/v1/orders", json=invalid, headers=auth_headers)
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestListOrders:
    async def test_list_orders_authenticated(self, client: AsyncClient, auth_headers: dict):
        """내 의뢰 목록 조회"""
        resp = await client.get("/api/v1/orders", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_orders_unauthenticated(self, client: AsyncClient):
        """비로그인 목록 조회 → 401/403"""
        resp = await client.get("/api/v1/orders")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestOrderDetail:
    async def test_get_order_success(self, client: AsyncClient, auth_headers: dict):
        """의뢰 상세 조회"""
        create_resp = await client.post("/api/v1/orders", json=VALID_ORDER, headers=auth_headers)
        assert create_resp.status_code == 201
        order_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == order_id

    async def test_get_order_not_found(self, client: AsyncClient, auth_headers: dict):
        """존재하지 않는 의뢰 ID → 404"""
        fake_id = str(uuid.uuid4())
        resp = await client.get(f"/api/v1/orders/{fake_id}", headers=auth_headers)
        assert resp.status_code == 404

    async def test_get_other_users_order(self, client: AsyncClient, auth_headers: dict):
        """다른 유저의 의뢰 접근 → 403/404"""
        # 두 번째 유저 생성 후 로그인으로 토큰 획득
        email2 = f"user2_{uuid.uuid4().hex[:8]}@test.com"
        await client.post("/api/v1/auth/register", json={
            "email": email2, "password": "pass1234!", "full_name": "유저2"
        })
        login2 = await client.post("/api/v1/auth/login", json={
            "email": email2, "password": "pass1234!"
        })
        assert login2.status_code == 200, f"유저2 로그인 실패: {login2.text}"
        token2 = login2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # 유저2의 의뢰 생성
        create_resp = await client.post("/api/v1/orders", json=VALID_ORDER, headers=headers2)
        assert create_resp.status_code == 201
        order_id = create_resp.json()["id"]

        # 유저1이 유저2의 의뢰 조회 시도
        resp = await client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)
        assert resp.status_code in (403, 404)


@pytest.mark.asyncio
class TestStartOrder:
    async def test_start_free_order(self, client: AsyncClient, auth_headers: dict):
        """무료 의뢰 시작 → active 상태"""
        create_resp = await client.post("/api/v1/orders", json=VALID_ORDER, headers=auth_headers)
        assert create_resp.status_code == 201
        order_id = create_resp.json()["id"]

        start_resp = await client.post(f"/api/v1/orders/{order_id}/start", headers=auth_headers)
        assert start_resp.status_code == 200
        data = start_resp.json()
        assert data["status"] == "active"

    async def test_start_order_twice(self, client: AsyncClient, auth_headers: dict):
        """이미 시작된 의뢰 재시작 → 400"""
        create_resp = await client.post("/api/v1/orders", json=VALID_ORDER, headers=auth_headers)
        order_id = create_resp.json()["id"]

        await client.post(f"/api/v1/orders/{order_id}/start", headers=auth_headers)
        resp = await client.post(f"/api/v1/orders/{order_id}/start", headers=auth_headers)
        assert resp.status_code == 400
