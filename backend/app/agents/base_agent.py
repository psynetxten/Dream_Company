import time
import google.generativeai as genai
from typing import Any, Callable
from app.config import settings
import structlog

logger = structlog.get_logger()

class BaseAgent:
    """모든 에이전트의 기반 클래스 - Gemini 지원 (Zero-Cost Pivot)"""

    def __init__(
        self,
        model: str = None,
        max_tokens: int = 4096,
        system_prompt: str = "",
        agent_name: str = "base",
    ):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model_name = model or "gemini-1.5-flash"
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_prompt
        )
        self.max_tokens = max_tokens
        self.system_prompt = system_prompt
        self.agent_name = agent_name

    def run_sync(self, user_message: str) -> str:
        """동기 단일 실행"""
        try:
            response = self.model.generate_content(user_message)
            return response.text
        except Exception as e:
            logger.error("agent_run_failed", agent=self.agent_name, error=str(e))
            raise

    async def run_async(self, user_message: str) -> str:
        """비동기 단일 실행"""
        try:
            response = await self.model.generate_content_async(user_message)
            return response.text
        except Exception as e:
            logger.error("agent_run_async_failed", agent=self.agent_name, error=str(e))
            raise

    def run_with_tools_sync(
        self,
        user_message: str,
        tools: list,
        tool_executor: Callable[[str, dict], Any],
        max_iterations: int = 10,
    ) -> str:
        """
        도구 호출 루프 포함 동기 실행 (Gemini 전용)
        참고: Gemini의 도구 호출 방식은 Anthropic과 다르므로 구현 시 주의가 필요합니다.
        MVP에서는 도구 호출 기능을 단순화하거나 필요 시 확장합니다.
        """
        # 현재는 도구 없이 텍스트 생성 위주로 동작하게 구현
        return self.run_sync(user_message)

    def get_usage(self, response: Any) -> dict:
        """토큰 사용량 추출 (Gemini 대응)"""
        # Gemini API 응답에서 토큰 정보를 가져오는 로직 (필요 시 구현)
        return {
            "model": self.model_name,
            "agent": self.agent_name
        }
