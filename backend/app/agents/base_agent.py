import asyncio
import contextvars
from typing import Any, Callable
import anthropic
from app.config import settings
import structlog

logger = structlog.get_logger()

_RETRY_DELAYS = [10, 30, 60]  # 재시도 대기(초)

# ── 토큰 사용량 실측 집계 (신문 1편 단위) ──
# asyncio.gather는 각 코루틴을 별도 태스크로 감싸고 태스크마다 컨텍스트를 복사하므로,
# 신문별로 reset_usage_tracking()을 호출하면 동시 생성돼도 서로 격리되어 정확히 집계된다.
_usage_ctx: contextvars.ContextVar[dict | None] = contextvars.ContextVar("usage_ctx", default=None)


def reset_usage_tracking() -> None:
    """현재 컨텍스트의 토큰 집계 초기화 (신문 생성 시작 시 호출)"""
    _usage_ctx.set({"input": 0, "output": 0, "calls": 0})


def get_usage_tracking() -> dict | None:
    """누적된 토큰 사용량 반환 ({input, output, calls}) — 미초기화면 None"""
    return _usage_ctx.get()


def _record_usage(response: Any) -> None:
    acc = _usage_ctx.get()
    usage = getattr(response, "usage", None)
    if acc is not None and usage is not None:
        acc["input"] += getattr(usage, "input_tokens", 0) or 0
        acc["output"] += getattr(usage, "output_tokens", 0) or 0
        acc["calls"] += 1


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
    _record_usage(response)
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
    _record_usage(response)
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
