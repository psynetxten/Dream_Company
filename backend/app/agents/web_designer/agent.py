"""
WebDesigner — 전문 웹 디자이너 에이전트

역할:
- 실제 Next.js + Tailwind CSS 코드 레벨 구현 제안
- 컴포넌트 코드 생성 및 개선안 작성
- 랜딩페이지 섹션별 HTML/JSX 스니펫 제안
- 반응형·접근성·성능 관점 코드 리뷰
- UIDesigner의 스펙을 받아 실제 구현 코드로 변환

UIDesigner와의 구분:
- UIDesigner: 디자인 스펙, 와이어프레임, CRO 기획 (개념 레벨)
- WebDesigner: 실제 JSX/CSS 코드 작성, 픽셀 퍼펙트 구현 (코드 레벨)
"""
import json
import structlog
from google import genai
from google.genai import types
from app.config import settings

logger = structlog.get_logger()

SYSTEM_PROMPT = """당신은 꿈신문사의 전문 웹 디자이너입니다.

기술 스택: Next.js 15 (App Router) + TypeScript + Tailwind CSS
디자인 시스템:
- 배경: newsprint-50 (#fafaf7), newsprint-100, newsprint-200, newsprint-300
- 텍스트: ink (#1a1a2e), ink-muted (#4a4a5a), ink-light
- 폰트: font-headline (Noto Serif KR, serif), font-serif (기본)
- 테마: 빈티지 신문 — 두꺼운 테두리(border-ink), 대문자(uppercase), 클래식 타이포

원칙:
1. 실제 동작하는 Next.js/Tailwind 코드만 작성
2. 'use client' 필요 여부를 항상 명시
3. 반응형(모바일 우선) 필수
4. 접근성(aria, alt, semantic HTML) 기본 적용
5. 불필요한 외부 라이브러리 사용 금지
"""


class WebDesigner:
    """WebDesigner (웹 디자이너) — Next.js + Tailwind 코드 레벨 구현 담당"""

    def __init__(self):
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.WRITER_MODEL
        self.agent_name = "web-designer"
        self._config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=4096,
        )

    async def generate_component(self, component_name: str, requirements: str) -> dict:
        """
        Next.js 컴포넌트 코드 생성

        Args:
            component_name: 컴포넌트명 (예: "HeroSection", "PricingCard")
            requirements: 요구사항 설명

        Returns:
            {"code": str, "filename": str, "notes": str}
        """
        prompt = f"""
컴포넌트명: {component_name}
요구사항:
{requirements}

다음 JSON 형식으로 반환하세요:
{{
  "code": "완전한 TSX 코드 (import 포함)",
  "filename": "권장 파일명 (예: HeroSection.tsx)",
  "notes": "구현 시 주의사항 및 사용 방법"
}}
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            result = json.loads(response.text)
            logger.info("web_designer_component_generated", component=component_name)
            return result
        except Exception as e:
            logger.error("web_designer_component_failed", error=str(e))
            return {
                "code": f"// {component_name} 코드 생성 실패 — 수동 구현 필요\n",
                "filename": f"{component_name}.tsx",
                "notes": f"생성 실패: {str(e)}",
            }

    async def review_page(self, page_description: str, issues: list[str]) -> dict:
        """
        페이지 코드 리뷰 및 개선안 제시

        Args:
            page_description: 페이지 설명 (예: "랜딩페이지 — Next.js App Router")
            issues: 알려진 문제점 목록

        Returns:
            {"fixes": list, "code_snippets": list, "priority": str}
        """
        prompt = f"""
페이지: {page_description}
알려진 문제점:
{chr(10).join(f"- {i}" for i in issues)}

코드 레벨에서 수정 방법을 JSON으로 반환하세요:
{{
  "fixes": [
    {{"issue": "문제점", "solution": "해결 방법", "code": "수정 코드 스니펫"}}
  ],
  "priority": "즉시 수정 / 다음 스프린트 / 장기"
}}
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            result = json.loads(response.text)
            logger.info("web_designer_review_done", page=page_description)
            return result
        except Exception as e:
            logger.error("web_designer_review_failed", error=str(e))
            return {"fixes": [], "priority": "수동 검토 필요"}

    async def suggest_section(self, section_name: str, context: str) -> str:
        """
        랜딩페이지 섹션 JSX 코드 스니펫 생성

        Args:
            section_name: 섹션명 (예: "HeroSection", "PricingSection")
            context: 섹션 목적 및 내용 설명

        Returns:
            JSX 코드 문자열
        """
        prompt = f"""
섹션명: {section_name}
목적 및 내용: {context}

꿈신문사 디자인 시스템을 적용한 완전한 JSX 코드 스니펫을 작성하세요.
코드만 반환하고, 마크다운 코드블록 없이 순수 TSX 코드만 반환하세요.
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                config=self._config,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            logger.error("web_designer_section_failed", error=str(e))
            return f"// {section_name} 생성 실패"
