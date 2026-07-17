"""
미래 헤드라인 생성기 — 홍보용 무료 후크.

SNS/랜딩에서 로그인 없이 이름+꿈 한 줄을 넣으면, 꿈신문 스타일의
미래 신문 헤드라인을 즉석에서 생성한다. 공유용 카드 + 3일 무료 CTA로
서비스 유입(구독자 획득)의 다리 역할.

브랜드 규칙(신문 본문과 동일):
- 날짜는 가까운 미래, 시점은 현재진행형(미래형·과거형 금지).
- 3인칭 신문 기사체, 주인공 실명 포함.
- 부정적 표현 금지, 과장 수치 나열 금지.
"""
import json
import re
from datetime import date

import structlog

from app.agents.base_agent import _call_anthropic_async
from app.config import settings

logger = structlog.get_logger()

# 가까운 미래 규칙(2027/2028 우선). 실행 연도 기준 2~3년 뒤.
_NEAR_FUTURE_OFFSET = 2

_SYSTEM = (
    "너는 '꿈신문사'의 편집기자다. 사용자의 꿈을 '이미 이루어진 미래'의 "
    "신문 1면 헤드라인으로 만든다.\n"
    "규칙(반드시 지킬 것):\n"
    "- 3인칭 신문 기사체. 주인공 실명을 헤드라인에 자연스럽게 넣는다.\n"
    "- 시점은 현재진행형. '~할 것이다/~하겠다' 같은 미래형, '~했다/~였다' 같은 "
    "과거형을 쓰지 않는다. '~다/~하다' 현재형으로 끝맺는다.\n"
    "- 긍정적이고 품위 있게. 과장된 수치 나열 금지.\n"
    "- 헤드라인은 18~40자, 부제는 25~55자.\n"
    "- 반드시 아래 JSON 형식으로만 출력한다(다른 텍스트 없이):\n"
    '{"headline": "...", "subhead": "..."}'
)


def _future_year() -> int:
    return date.today().year + _NEAR_FUTURE_OFFSET


def _fallback(name: str, dream: str, year: int) -> dict:
    n = (name or "당신").strip()
    d = (dream or "자신의 꿈").strip()
    return {
        "headline": f"{n}, 마침내 {d}의 자리에 서다",
        "subhead": f"{year}년, {n}이(가) 오래 꿈꾸던 하루를 살아가고 있다",
        "year": year,
    }


async def generate_headline(name: str, dream: str) -> dict:
    """이름+꿈으로 미래 신문 헤드라인 생성. 실패 시 안전한 템플릿 폴백."""
    year = _future_year()
    name = (name or "").strip()[:20]
    dream = (dream or "").strip()[:200]
    if not name or not dream:
        return _fallback(name, dream, year)

    prompt = (
        f"주인공 이름: {name}\n"
        f"꿈: {dream}\n"
        f"미래 연도: {year}년\n\n"
        "위 인물이 그 꿈을 이미 이룬 미래를, 그날의 신문 1면 헤드라인으로 써라."
    )
    try:
        raw = await _call_anthropic_async(
            prompt=prompt,
            system=_SYSTEM,
            model=settings.WRITER_MODEL,
            max_tokens=300,
        )
        text = (raw or "").strip()
        # JSON 블록만 추출
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return _fallback(name, dream, year)
        data = json.loads(match.group(0))
        headline = str(data.get("headline", "")).strip()
        subhead = str(data.get("subhead", "")).strip()
        if not headline:
            return _fallback(name, dream, year)
        return {"headline": headline, "subhead": subhead, "year": year}
    except Exception as e:
        logger.warning("headline_generation_failed", error=str(e))
        return _fallback(name, dream, year)
