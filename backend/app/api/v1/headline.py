"""미래 헤드라인 생성기 — 공개(인증 불필요) 홍보 후크 엔드포인트."""
import time

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.headline_generator import generate_headline

router = APIRouter(prefix="/headline", tags=["headline"])

# 남용 방지용 초경량 IP 스로틀(인메모리). 정밀 방어가 아니라 봇 폭주 완충용.
_RATE: dict[str, list[float]] = {}
_WINDOW_SEC = 60.0
_MAX_PER_WINDOW = 8


def _throttled(ip: str) -> bool:
    now = time.time()
    hits = [t for t in _RATE.get(ip, []) if now - t < _WINDOW_SEC]
    if len(hits) >= _MAX_PER_WINDOW:
        _RATE[ip] = hits
        return True
    hits.append(now)
    _RATE[ip] = hits
    return False


class HeadlineRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=20)
    dream: str = Field(..., min_length=2, max_length=200)


@router.post("/generate")
async def create_headline(data: HeadlineRequest, request: Request):
    """이름+꿈 → 미래 신문 헤드라인(공유용). 로그인 불필요."""
    ip = request.client.host if request.client else "unknown"
    if _throttled(ip):
        raise HTTPException(status_code=429, detail="잠시 후 다시 시도해주세요.")
    result = await generate_headline(name=data.name, dream=data.dream)
    return result
