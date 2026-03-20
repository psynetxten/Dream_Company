"""
BrandMarketer — 브랜드 마케팅 담당 에이전트

역할:
- 꿈신문사 브랜드 아이덴티티 수호 및 발전
- 유저 접점 카피라이팅 (랜딩페이지, 이메일, 알림 등)
- 브랜드 톤앤매너 가이드 작성 및 검수
- 캠페인 기획 및 채널별 메시지 전략
- "AI/인간" 이분법 없이 따뜻한 편집국 브랜드 구축

브랜드 핵심 원칙:
- 꿈신문사는 실제 신문사처럼 느껴져야 한다
- 기술(AI)은 보이지 않는 곳에서 작동한다
- 유저는 꿈신문사에 '의뢰'를 넣는 독자·의뢰인
- 기자단/전담기자는 실제 뉴스룸처럼 묘사
"""
import json
import structlog
from google import genai
from google.genai import types
from app.config import settings

logger = structlog.get_logger()

BRAND_IDENTITY = """
[꿈신문사 브랜드 아이덴티티]

**미션**: 모든 사람의 꿈을 오늘의 헤드라인으로 만든다.

**포지셔닝**: 당신의 미래를 먼저 써드리는 신문사

**톤앤매너**:
- 따뜻하고 진심 어린 — 차갑거나 기계적이지 않게
- 권위 있되 친근한 — 신뢰할 수 있는 신문사의 목소리
- 희망적이고 생생한 — 꿈이 현실처럼 느껴지게
- 간결하고 함축적 — 헤드라인처럼 임팩트 있게

**금지 표현**:
- "AI", "인공지능", "자동", "알고리즘" — 기술 냄새 제거
- "인간 작가" — 어색한 대비, 사용 금지
- "자동 생성", "AI 작성" — 따뜻함 훼손

**권장 표현**:
- "기자단이 씁니다" / "꿈신문사 기자단"
- "전담 기자가 직접 씁니다"
- "편집국이 준비합니다"
- "당신만을 위한 기자가 배정됩니다"
- "의뢰", "연재", "발행" (신문사 용어 사용)

**브랜드 세계관**:
- 꿈신문사는 미래에서 발행되는 신문사
- 기자단은 의뢰인의 꿈을 취재해 기사로 쓴다
- 독자(유저)는 자신의 미래를 신문으로 먼저 받아본다
- 스폰서 기업은 독자의 꿈 스토리에 자연스럽게 등장하는 파트너
"""

SYSTEM_PROMPT = f"""당신은 꿈신문사의 브랜드 마케팅 담당자입니다.

{BRAND_IDENTITY}

당신의 임무:
1. 브랜드 아이덴티티에 맞는 카피라이팅
2. 유저 접점 문구의 브랜드 일관성 검수
3. 캠페인 아이디어 및 채널별 메시지 전략
4. 모든 결과물은 위 브랜드 원칙을 철저히 준수
"""


class BrandMarketer:
    """BrandMarketer (브랜드 마케팅 담당) — 브랜드 아이덴티티 및 카피라이팅"""

    def __init__(self):
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.WRITER_MODEL
        self.agent_name = "brand-marketer"

    async def write_copy(self, placement: str, context: str) -> dict:
        """
        유저 접점 카피 작성

        Args:
            placement: 노출 위치 (예: "랜딩페이지 히어로", "CTA 버튼", "온보딩 이메일")
            context: 전달하려는 메시지/목적

        Returns:
            {"headline": str, "body": str, "cta": str, "notes": str}
        """
        prompt = f"""
노출 위치: {placement}
전달 목적: {context}

꿈신문사 브랜드 아이덴티티에 맞게 카피를 작성하세요.
JSON 형식으로 반환:
{{
  "headline": "헤드라인 카피",
  "body": "본문 카피 (1-3문장)",
  "cta": "행동 유도 버튼 문구",
  "notes": "기획 의도 및 사용 지침"
}}
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            result = json.loads(response.text)
            logger.info("brand_copy_generated", placement=placement)
            return result
        except Exception as e:
            logger.error("brand_copy_failed", error=str(e))
            return {
                "headline": "당신의 꿈이 내일의 헤드라인",
                "body": "꿈신문사 기자단이 당신의 이야기를 씁니다.",
                "cta": "의뢰하기",
                "notes": "생성 실패 — 기본 카피 반환",
            }

    async def audit_copy(self, copy_text: str) -> dict:
        """
        기존 카피의 브랜드 일관성 검수

        Args:
            copy_text: 검수할 카피 텍스트

        Returns:
            {"score": float, "violations": list, "suggestions": list}
        """
        prompt = f"""
다음 카피를 꿈신문사 브랜드 가이드라인에 따라 검수하세요:

---
{copy_text}
---

JSON으로 반환:
{{
  "score": 0.0-1.0,
  "violations": ["가이드라인 위반 항목"],
  "suggestions": ["수정 제안 (원문 → 수정안 형식)"]
}}
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error("brand_audit_failed", error=str(e))
            return {"score": 0.0, "violations": [], "suggestions": []}

    async def plan_campaign(self, goal: str, channels: list[str]) -> dict:
        """
        마케팅 캠페인 기획

        Args:
            goal: 캠페인 목표 (예: "신규 가입자 1000명 달성")
            channels: 사용할 채널 목록 (예: ["인스타그램", "카카오채널", "이메일"])

        Returns:
            {"concept": str, "messages": dict, "timeline": str}
        """
        prompt = f"""
캠페인 목표: {goal}
채널: {', '.join(channels)}

꿈신문사 브랜드에 맞는 캠페인을 기획하세요.
JSON으로 반환:
{{
  "concept": "캠페인 핵심 컨셉 (한 줄)",
  "messages": {{
    "채널명": "해당 채널용 핵심 메시지"
  }},
  "timeline": "권장 캠페인 일정",
  "hook": "바이럴 포인트 또는 핵심 훅"
}}
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            result = json.loads(response.text)
            logger.info("brand_campaign_planned", goal=goal)
            return result
        except Exception as e:
            logger.error("brand_campaign_failed", error=str(e))
            return {"concept": "", "messages": {}, "timeline": "", "hook": ""}
