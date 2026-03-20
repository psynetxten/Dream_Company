"""
UIDesigner — UI/UX 디자인 스펙 생성 에이전트

역할:
- 페이지 레이아웃 및 컴포넌트 디자인 스펙 제안
- Tailwind CSS 클래스 기반 디자인 가이드 생성
- 전환율(CRO) 관점의 UI 개선안 제안
- CTO에게 구현 스펙을 메모로 전달
"""
import structlog
from google import genai
from google.genai import types
from app.config import settings

logger = structlog.get_logger()


class UIDesigner:
    """UI Designer (UI/UX 디자이너) — 디자인 스펙 및 개선안 생성"""

    def __init__(self):
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.WRITER_MODEL
        self.agent_name = "ui-designer"

    async def generate_component_spec(self, component_name: str, context: str) -> dict:
        """
        컴포넌트 디자인 스펙 생성

        Args:
            component_name: 컴포넌트 이름 (예: "NewspaperCard", "HeroSection")
            context: 컴포넌트 사용 맥락 및 요구사항

        Returns:
            {"layout": str, "tailwind_classes": str, "ux_notes": str}
        """
        prompt = f"""
당신은 꿈신문사의 UI/UX 디자이너입니다.
신문 테마(newsprint 색상, serif 폰트, 빈티지 레이아웃)를 기반으로 디자인합니다.

컴포넌트: {component_name}
맥락: {context}

Tailwind CSS와 신문 테마 커스텀 클래스(newsprint-50~900, ink, font-headline)를 사용해
다음 JSON 형식으로 디자인 스펙을 작성하세요:
{{
  "layout": "레이아웃 설명",
  "tailwind_classes": "핵심 Tailwind 클래스 목록",
  "ux_notes": "UX/전환율 관점 주의사항",
  "cto_memo": "CTO에게 전달할 구현 지시사항"
}}
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            import json
            return json.loads(response.text)
        except Exception as e:
            logger.error("ui_designer_spec_failed", error=str(e))
            return {
                "layout": f"{component_name} 기본 레이아웃",
                "tailwind_classes": "border-2 border-ink bg-newsprint-50 p-6",
                "ux_notes": "신문 테마 일관성 유지",
                "cto_memo": "스펙 자동 생성 실패 — 수동 검토 필요",
            }

    async def audit_landing_page(self, page_sections: list[str]) -> dict:
        """
        랜딩페이지 CRO(전환율 최적화) 감사

        Args:
            page_sections: 페이지 섹션 목록

        Returns:
            {"score": float, "issues": list, "improvements": list}
        """
        prompt = f"""
당신은 꿈신문사의 UI/UX 디자이너이자 CRO 전문가입니다.
아래 랜딩페이지 섹션 구성을 분석해 전환율 관점에서 평가하세요.

섹션 구성:
{chr(10).join(f"- {s}" for s in page_sections)}

JSON으로 반환:
{{
  "score": 0.0-1.0,
  "issues": ["문제점 목록"],
  "improvements": ["개선안 목록"],
  "priority": "즉시 수정 / 다음 스프린트 / 장기 과제"
}}
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            import json
            return json.loads(response.text)
        except Exception as e:
            logger.error("ui_designer_audit_failed", error=str(e))
            return {"score": 0.7, "issues": [], "improvements": [], "priority": "장기 과제"}
