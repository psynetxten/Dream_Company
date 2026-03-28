import json
import re
import time
from datetime import datetime
from app.agents.base_agent import BaseAgent
from app.config import settings
import structlog

logger = structlog.get_logger()

MOBILE_QA_SYSTEM_PROMPT = """당신은 모바일 QA 전문가입니다.
웹 페이지의 모바일 반응형, 터치 UX, 가독성, 성능 문제를 정밀하게 분석하고
명확한 리포트를 작성합니다.

검사 원칙:
- 터치 영역은 최소 44×44px (Apple HIG 기준)
- 폰트 크기는 본문 최소 16px, 캡션 최소 12px
- 뷰포트 너비 320px~428px 범위에서 깨지는 레이아웃 확인
- 스크롤 가능 영역이 뷰포트를 초과하지 않는지 확인
- 클릭 가능 요소 간 최소 8px 간격 유지
- 이미지/미디어의 max-width: 100% 적용 여부 확인

리포트는 항상 한국어로 작성하고,
이슈마다 severity(critical/warning/info)와 수정 방법을 함께 제시합니다."""


class MobileQA(BaseAgent):
    """MobileQA — 모바일 반응형/UX/성능 품질 검사 에이전트"""

    def __init__(self):
        super().__init__(
            model=settings.WRITER_MODEL,
            max_tokens=4096,
            system_prompt=MOBILE_QA_SYSTEM_PROMPT,
            agent_name="mobile-qa",
        )

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    async def run_mobile_check(self, url: str, pages: list[str]) -> dict:
        """
        모바일 체크 전체 실행

        Args:
            url: 베이스 URL (예: "http://localhost:3000")
            pages: 검사할 경로 목록 (예: ["/", "/order", "/newspaper/1"])

        Returns:
            {
                url, pages_checked, total_issues,
                critical_count, warning_count, info_count,
                issues_by_page, summary, checked_at
            }
        """
        start_time = time.time()
        logger.info("mobile_qa_start", url=url, pages=pages)

        all_issues: list[dict] = []
        issues_by_page: dict[str, list[dict]] = {}

        for page_path in pages:
            full_url = url.rstrip("/") + page_path
            # 실제 HTTP 요청 없이 LLM 기반 정적 분석 수행
            page_issues = await self._analyze_page(full_url, page_path)
            issues_by_page[page_path] = page_issues
            all_issues.extend(page_issues)

        critical_count = sum(1 for i in all_issues if i.get("severity") == "critical")
        warning_count = sum(1 for i in all_issues if i.get("severity") == "warning")
        info_count = sum(1 for i in all_issues if i.get("severity") == "info")

        summary = await self.generate_qa_report(all_issues)

        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "mobile_qa_done",
            url=url,
            total_issues=len(all_issues),
            critical=critical_count,
            elapsed_ms=elapsed_ms,
        )

        return {
            "url": url,
            "pages_checked": pages,
            "total_issues": len(all_issues),
            "critical_count": critical_count,
            "warning_count": warning_count,
            "info_count": info_count,
            "issues_by_page": issues_by_page,
            "summary": summary,
            "checked_at": datetime.utcnow().isoformat() + "Z",
            "elapsed_ms": elapsed_ms,
        }

    async def check_responsive_issues(self, html_content: str) -> list[dict]:
        """
        HTML 콘텐츠를 분석하여 반응형/모바일 이슈 목록 반환

        Args:
            html_content: 분석할 HTML 문자열

        Returns:
            [
                {
                    "issue_id": str,
                    "severity": "critical" | "warning" | "info",
                    "category": str,       # responsive/touch/font/performance/layout
                    "description": str,
                    "element": str,        # 문제 요소 셀렉터 또는 설명
                    "recommendation": str
                },
                ...
            ]
        """
        truncated_html = html_content[:8000]  # 토큰 절약
        prompt = f"""다음 HTML을 분석하여 모바일 UX 이슈를 찾아주세요.

HTML:
```html
{truncated_html}
```

다음 항목을 반드시 검사하세요:
1. 터치 영역 크기 (버튼/링크의 min 44×44px 미충족 여부)
2. 폰트 크기 (본문 16px 미만, 캡션 12px 미만)
3. 뷰포트 너비 초과 요소 (overflow, 고정 width)
4. 이미지 max-width 미설정
5. 터치 요소 간 간격 부족 (8px 미만)
6. 반응형 미디어 쿼리 누락
7. 모바일 viewport meta 태그 누락
8. 가로 스크롤 유발 요소

각 이슈를 JSON 배열로 반환하세요:
[
  {{
    "issue_id": "고유ID(숫자)",
    "severity": "critical|warning|info",
    "category": "touch|font|layout|responsive|performance",
    "description": "이슈 설명 (한국어)",
    "element": "CSS 셀렉터 또는 요소 설명",
    "recommendation": "수정 방법 (한국어)"
  }}
]

이슈가 없으면 빈 배열 []를 반환하세요.
JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요."""

        try:
            raw = await self.run_async(prompt)
            issues = self._parse_json_list(raw)
            # issue_id 보정
            for idx, issue in enumerate(issues):
                if not issue.get("issue_id"):
                    issue["issue_id"] = str(idx + 1)
            logger.info("responsive_check_done", issue_count=len(issues))
            return issues
        except Exception as e:
            logger.error("responsive_check_failed", error=str(e))
            return []

    async def generate_qa_report(self, issues: list) -> str:
        """
        이슈 목록을 바탕으로 모바일 QA 리포트 생성

        Args:
            issues: check_responsive_issues() 결과 목록

        Returns:
            마크다운 형식의 QA 리포트 문자열
        """
        if not issues:
            return "## 모바일 QA 리포트\n\n발견된 이슈가 없습니다. 모바일 UX 기준을 충족합니다."

        critical = [i for i in issues if i.get("severity") == "critical"]
        warning = [i for i in issues if i.get("severity") == "warning"]
        info = [i for i in issues if i.get("severity") == "info"]

        issues_summary = json.dumps(issues, ensure_ascii=False, indent=2)

        prompt = f"""다음 모바일 QA 이슈 목록을 바탕으로 전문적인 QA 리포트를 작성해주세요.

이슈 목록:
{issues_summary}

통계:
- Critical (즉시 수정 필요): {len(critical)}건
- Warning (권장 수정): {len(warning)}건
- Info (개선 권장): {len(info)}건

리포트는 다음 구조로 작성하세요:
1. 요약 (전체 현황 2-3문장)
2. Critical 이슈 목록 (각 이슈: 문제, 영향, 수정 방법)
3. Warning 이슈 목록
4. Info 이슈 목록
5. 우선순위 수정 권고사항 (상위 3가지)

마크다운 형식으로 작성하세요."""

        try:
            report = await self.run_async(prompt)
            logger.info("qa_report_generated", issue_count=len(issues))
            return report.strip()
        except Exception as e:
            logger.error("qa_report_generation_failed", error=str(e))
            return self._fallback_report(critical, warning, info)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _analyze_page(self, full_url: str, page_path: str) -> list[dict]:
        """
        페이지 경로 기반 LLM 분석 (실제 HTTP 페치 없이 경로/URL 패턴으로 추론)
        실제 HTML 접근이 필요한 경우 외부에서 html_content를 주입해 check_responsive_issues() 호출.
        """
        prompt = f"""모바일 웹앱에서 다음 페이지 경로를 분석하세요.

URL: {full_url}
페이지 경로: {page_path}

이 경로의 일반적인 페이지 구성을 바탕으로 예상되는 모바일 UX 이슈를 점검하세요.

꿈신문사 서비스 특성:
- 신문 레이아웃 (헤드라인, 본문, 사이드바)
- 의뢰 폼 (입력 필드, 버튼)
- 사용자 대시보드 (목록, 카드)

각 경로 유형별로 예상 이슈를 JSON 배열로 반환:
[
  {{
    "issue_id": "고유ID",
    "severity": "critical|warning|info",
    "category": "touch|font|layout|responsive|performance",
    "description": "이슈 설명",
    "element": "예상 요소",
    "recommendation": "수정 방법"
  }}
]

JSON 배열만 반환하세요."""

        try:
            raw = await self.run_async(prompt)
            issues = self._parse_json_list(raw)
            for idx, issue in enumerate(issues):
                issue["page"] = page_path
                if not issue.get("issue_id"):
                    issue["issue_id"] = f"{page_path.replace('/', '_')}_{idx + 1}"
            return issues
        except Exception as e:
            logger.error("page_analysis_failed", page=page_path, error=str(e))
            return []

    def _parse_json_list(self, text: str) -> list[dict]:
        """LLM 응답에서 JSON 배열 파싱"""
        if not text:
            return []

        # 직접 파싱
        stripped = text.strip()
        try:
            result = json.loads(stripped)
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass

        # 코드블록 내 JSON 추출
        match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", text, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group(1))
                if isinstance(result, list):
                    return result
            except json.JSONDecodeError:
                pass

        # 대괄호 범위 추출
        start = text.find("[")
        end = text.rfind("]") + 1
        if start != -1 and end > start:
            try:
                result = json.loads(text[start:end])
                if isinstance(result, list):
                    return result
            except json.JSONDecodeError:
                pass

        logger.warning("json_list_parse_failed", raw_preview=text[:200])
        return []

    def _fallback_report(
        self,
        critical: list,
        warning: list,
        info: list,
    ) -> str:
        """LLM 리포트 생성 실패 시 기본 마크다운 리포트"""
        lines = [
            "## 모바일 QA 리포트",
            "",
            f"- Critical: {len(critical)}건",
            f"- Warning: {len(warning)}건",
            f"- Info: {len(info)}건",
            "",
        ]
        if critical:
            lines.append("### Critical 이슈")
            for issue in critical:
                lines.append(f"- **{issue.get('description', '')}** — {issue.get('recommendation', '')}")
            lines.append("")
        if warning:
            lines.append("### Warning 이슈")
            for issue in warning:
                lines.append(f"- {issue.get('description', '')} — {issue.get('recommendation', '')}")
            lines.append("")
        if info:
            lines.append("### Info")
            for issue in info:
                lines.append(f"- {issue.get('description', '')}")
        return "\n".join(lines)
