import asyncio
from typing import Any, Callable
import anthropic
from app.config import settings
import structlog

logger = structlog.get_logger()

_RETRY_DELAYS = [10, 30, 60]  # 재시도 대기(초)


def _call_anthropic(prompt: str, system: str = "", model: str = "", max_tokens: int = 4096) -> str:
    """Anthropic SDK 동기 호출"""
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    messages = [{"role": "user", "content": prompt}]

    kwargs: dict[str, Any] = {
        "model": model or settings.WRITER_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system

    response = client.messages.create(**kwargs)
    return response.content[0].text


async def _call_anthropic_async(
    prompt: str, system: str = "", model: str = "", max_tokens: int = 4096
) -> str:
    """Anthropic SDK 비동기 호출"""
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    messages = [{"role": "user", "content": prompt}]

    kwargs: dict[str, Any] = {
        "model": model or settings.WRITER_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system

    response = await client.messages.create(**kwargs)
    return response.content[0].text


class BaseAgent:
    """모든 에이전트의 기반 클래스 — Anthropic Python SDK"""

    def __init__(
        self,
        model: str = None,
        max_tokens: int = 4096,
        system_prompt: str = "",
        agent_name: str = "base",
    ):
        self.model_name = model or settings.WRITER_MODEL
        self.max_tokens = max_tokens
        self.system_prompt = system_prompt
        self.agent_name = agent_name

    def run_sync(self, user_message: str) -> str:
        """동기 단일 실행 (재시도 포함)"""
        last_error = None
        for attempt, delay in enumerate([0] + _RETRY_DELAYS, 1):
            try:
                if delay:
                    import time
                    time.sleep(delay)
                return _call_anthropic(
                    prompt=user_message,
                    system=self.system_prompt,
                    model=self.model_name,
                    max_tokens=self.max_tokens,
                )
            except Exception as e:
                last_error = e
                logger.warning(
                    "agent_retry", agent=self.agent_name, attempt=attempt, error=str(e)
                )
        logger.error("agent_run_failed", agent=self.agent_name, error=str(last_error))
        raise last_error

    async def run_async(self, user_message: str) -> str:
        """비동기 단일 실행 (재시도 포함)"""
        last_error = None
        for attempt, delay in enumerate([0] + _RETRY_DELAYS, 1):
            try:
                if delay:
                    await asyncio.sleep(delay)
                return await _call_anthropic_async(
                    prompt=user_message,
                    system=self.system_prompt,
                    model=self.model_name,
                    max_tokens=self.max_tokens,
                )
            except Exception as e:
                last_error = e
                logger.warning(
                    "agent_retry_async",
                    agent=self.agent_name,
                    attempt=attempt,
                    error=str(e),
                )
        logger.error(
            "agent_run_async_failed", agent=self.agent_name, error=str(last_error)
        )
        raise last_error

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
            "agent": self.agent_name,
        }
