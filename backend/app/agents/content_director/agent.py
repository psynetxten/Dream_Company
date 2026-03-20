import structlog
from google import genai
from app.config import settings

logger = structlog.get_logger()

class ContentDirector:
    """Content Director (콘텐츠 디렉터) — 이미지 생성 프롬프트 제작"""

    def __init__(self):
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.WRITER_MODEL
        self.agent_name = "content-director"

    async def generate_visual_prompt(self, newspaper_content: str) -> str:
        """이미지 생성용 상세 프롬프트 생성"""
        prompt = f"""
당신은 '꿈신문사'의 [콘텐츠 디렉터]입니다.
작성된 기사 내용을 바탕으로, 이를 가장 잘 표현할 수 있는 한 장의 핵심 이미지를 디자인합니다.
이미지 생성 AI(Stable Diffusion 계열)가 고품질의 이미지를 그릴 수 있도록 영문 프롬프트를 작성하세요.

프롬프트 작성 규칙:
1. 문장이 아닌 쉼표로 구분된 태그(Keywords) 형태로 작성하세요.
2. 스타일 포함: Cinematic, 8k, photorealistic, masterpiece, highly detailed.
3. 기사의 핵심 분위기와 주인공의 미래 활약상을 시각적으로 묘사하세요.
4. 오직 프롬프트 문자열만 반환하세요.

[미래 뉴스 내용]
{newspaper_content}
        """

        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            logger.error("content_director_failed", error=str(e))
            return "A cinematic, photorealistic scene of a successful future career in a modern office, golden hour lighting, 8k."
