import structlog
from google import genai
from google.genai import types
from app.config import settings

logger = structlog.get_logger()

class MarketingDirector:
    """Marketing Director (마케팅 팀장) — SNS 홍보 카피 생성"""

    def __init__(self):
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.WRITER_MODEL
        self.agent_name = "marketing-director"

    async def generate_sns_copy(self, newspaper_content: str) -> dict:
        """SNS용 홍보 문구 생성"""
        prompt = f"""
당신은 '꿈신문사'의 베테랑 [마케팅 팀장]입니다.
당신의 임무는 아래의 '미래 뉴스' 내용을 바탕으로 사람들이 클릭하고 싶어하는 SNS 홍보 카피를 작성하는 것입니다.

[미래 뉴스 내용]
{newspaper_content}

[작성 가이드라인]
1. 인스타그램용: 감성적이고 트렌디한 문구 + 관련 해시태그 5개 이상
2. 링크드인용: 이직/성공/자기계발 관점에서의 전문적인 요약
3. 트위터(X)용: 한눈에 들어오는 짧고 강렬한 한 줄 카피

형식은 반드시 아래와 같은 JSON 구조로 답변하세요:
{{
  "instagram": "본문 내용 및 해시태그",
  "linkedin": "본문 내용",
  "twitter": "본문 내용"
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
            logger.error("marketing_agent_failed", error=str(e))
            return {
                "instagram": "꿈은 이루어집니다! #꿈신문사",
                "linkedin": "미래를 미리 만나보세요.",
                "twitter": "당신의 미래, 지금 확인하세요."
            }
