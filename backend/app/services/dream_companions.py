"""
꿈 동료(같은 미래를 향한 사람들) — 비식별 열망 한 줄 생성 + 시드.

원칙:
- 절대 이름·회사·도구·앱·사적 정보를 노출하지 않는다(익명·비식별).
- 실데이터가 적을 때 공간이 비어 보이지 않도록 시드 열망으로 채운다.
"""
import re
import structlog
from app.agents.base_agent import _call_anthropic_async
from app.config import settings

logger = structlog.get_logger()

# 초기 데이터가 적을 때 공간을 채우는 큐레이션 시드(비식별·보편적 열망).
SEED_ASPIRATIONS: list[dict] = [
    {"year": 2032, "line": "카네기홀에 서는 피아니스트"},
    {"year": 2030, "line": "제주에 작은 서점을 여는 사람"},
    {"year": 2035, "line": "자기 이름의 웹툰을 연재하는 작가"},
    {"year": 2031, "line": "동네를 바꾸는 창업가"},
    {"year": 2033, "line": "세계를 무대로 뛰는 개발자"},
    {"year": 2030, "line": "환자 곁을 지키는 의사"},
    {"year": 2034, "line": "자연을 담는 다큐멘터리 감독"},
    {"year": 2032, "line": "따뜻한 빵을 굽는 동네 제빵사"},
]

_ASPIRATION_SYSTEM = (
    "너는 '비식별 열망 한 줄' 생성기다. 사용자의 꿈을 미래의 모습 한 줄로 압축한다.\n"
    "규칙(반드시 지킬 것):\n"
    "- 사람 이름, 회사명, 브랜드명, 도구·앱·파일 이름(예: Obsidian, Playwright), "
    "사이드프로젝트 코드명, 지역 실명, 그 외 개인 식별 정보를 절대 포함하지 않는다.\n"
    "- 12~22자 내외의 담담하고 보편적인 한 줄. 명사로 끝맺는다. 예: '카네기홀에 서는 피아니스트', '동네를 바꾸는 창업가'.\n"
    "- 따옴표·마침표·이모지 없이 문장만 출력한다."
)


def _fallback_line(target_role: str) -> str:
    role = (target_role or "자기 길을 걷는 사람").strip()
    return f"{role}의 길을 걷는 사람" if len(role) <= 12 else role


async def generate_public_aspiration(
    target_role: str,
    dream_description: str,
    future_year: int,
    protagonist_name: str = "",
) -> str:
    """주문에서 비식별 열망 한 줄을 생성한다. 실패 시 안전한 템플릿으로 폴백."""
    prompt = (
        f"목표 직군: {target_role}\n"
        f"꿈: {dream_description}\n"
        f"미래 연도: {future_year}\n\n"
        "위 꿈을 비식별 열망 한 줄로 압축해 출력하라."
    )
    try:
        raw = await _call_anthropic_async(
            prompt=prompt,
            system=_ASPIRATION_SYSTEM,
            model=settings.WRITER_MODEL,
            max_tokens=60,
        )
        line = (raw or "").strip().strip('"').strip("'").splitlines()[0].strip()
        line = re.sub(r"[.。!?]+$", "", line).strip()
        # 이름 누출 방어: 주인공 실명이 들어가면 폴백
        if protagonist_name and protagonist_name.strip() and protagonist_name.strip() in line:
            return _fallback_line(target_role)
        if not line or len(line) > 40:
            return _fallback_line(target_role)
        return line
    except Exception as e:
        logger.warning("aspiration_generation_failed", error=str(e))
        return _fallback_line(target_role)
