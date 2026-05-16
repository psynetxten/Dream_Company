import json
import re
import structlog
from app.agents.base_agent import BaseAgent

logger = structlog.get_logger()

class MarketingDirector:
    """Marketing Director (마케팅 팀장) — SNS 홍보 카피 생성"""

    def __init__(self):
        self._agent = BaseAgent(agent_name="marketing-director")

    async def generate_sns_copy(self, newspaper_content: str) -> dict:
        """SNS용 홍보 문구 생성"""
        prompt = f"""당신은 '꿈신문사'의 베테랑 [마케팅 팀장]입니다.
아래의 '미래 뉴스' 내용을 바탕으로 사람들이 클릭하고 싶어하는 SNS 홍보 카피를 작성하세요.

[미래 뉴스 내용]
{newspaper_content}

[작성 가이드라인]
1. 인스타그램용: 감성적이고 트렌디한 문구 + 관련 해시태그 5개 이상
2. 링크드인용: 이직/성공/자기계발 관점에서의 전문적인 요약
3. 트위터(X)용: 한눈에 들어오는 짧고 강렬한 한 줄 카피

반드시 아래 JSON 형식으로만 답변하세요:
{{
  "instagram": "본문 내용 및 해시태그",
  "linkedin": "본문 내용",
  "twitter": "본문 내용"
}}"""

        try:
            result = await self._agent.run_async(prompt)
            # JSON 블록 추출
            match = re.search(r'\{[\s\S]*\}', result)
            if match:
                return json.loads(match.group())
            return json.loads(result)
        except Exception as e:
            logger.error("marketing_agent_failed", error=str(e))
            return {
                "instagram": "꿈은 이루어집니다! #꿈신문사",
                "linkedin": "미래를 미리 만나보세요.",
                "twitter": "당신의 미래, 지금 확인하세요."
            }
