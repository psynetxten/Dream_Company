import time
import asyncio
from google import genai
from google.genai import types
from typing import Any, Callable
from app.config import settings
import structlog

logger = structlog.get_logger()

_RETRY_DELAYS = [10, 30, 60]  # 429 발생 시 재시도 대기(초)


class BaseAgent:
    """모든 에이전트의 기반 클래스 - Gemini (google-genai SDK)"""

    def __init__(
        self,
        model: str = None,
        max_tokens: int = 4096,
        system_prompt: str = "",
        agent_name: str = "base",
    ):
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = model or "gemini-2.0-flash"
        self.max_tokens = max_tokens
        self.system_prompt = system_prompt
        self.agent_name = agent_name
        self._config = types.GenerateContentConfig(
            system_instruction=system_prompt or None,
            max_output_tokens=max_tokens,
        )

    def run_sync(self, user_message: str) -> str:
        """동기 단일 실행 (429 자동 재시도)"""
        for attempt, delay in enumerate([0] + _RETRY_DELAYS, 1):
            try:
                if delay:
                    time.sleep(delay)
                response = self._client.models.generate_content(
                    model=self.model_name,
                    config=self._config,
                    contents=user_message,
                )
                return response.text
            except Exception as e:
                if "429" in str(e) and attempt <= len(_RETRY_DELAYS):
                    logger.warning("agent_rate_limit_retry", agent=self.agent_name, attempt=attempt, wait=delay)
                    continue
                logger.error("agent_run_failed", agent=self.agent_name, error=str(e))
                raise

    async def run_async(self, user_message: str) -> str:
        """비동기 단일 실행 (429 자동 재시도)"""
        for attempt, delay in enumerate([0] + _RETRY_DELAYS, 1):
            try:
                if delay:
                    await asyncio.sleep(delay)
                response = await self._client.aio.models.generate_content(
                    model=self.model_name,
                    config=self._config,
                    contents=user_message,
                )
                return response.text
            except Exception as e:
                if "429" in str(e) and attempt <= len(_RETRY_DELAYS):
                    logger.warning("agent_rate_limit_retry", agent=self.agent_name, attempt=attempt, wait=delay)
                    continue
                logger.error("agent_run_async_failed", agent=self.agent_name, error=str(e))
                raise

    def run_with_tools_sync(
        self,
        user_message: str,
        tools: list,
        tool_executor: Callable[[str, dict], Any],
        max_iterations: int = 10,
    ) -> str:
        return self.run_sync(user_message)

    def get_usage(self, response: Any) -> dict:
        return {
            "model": self.model_name,
            "agent": self.agent_name
        }
