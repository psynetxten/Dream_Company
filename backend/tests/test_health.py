"""
헬스체크 및 기본 라우터 테스트
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """API 서버가 응답하는지 확인"""
    resp = await client.get("/health")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_docs_accessible(client: AsyncClient):
    """OpenAPI 문서 접근 가능"""
    resp = await client.get("/docs")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_openapi_schema(client: AsyncClient):
    """OpenAPI JSON 스키마 반환"""
    resp = await client.get("/openapi.json")
    assert resp.status_code == 200
    data = resp.json()
    assert "paths" in data
    assert "openapi" in data
