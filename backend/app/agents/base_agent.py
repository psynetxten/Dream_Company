import asyncio
import os
import re
import subprocess
from typing import Any, Callable
from app.config import settings
import structlog

logger = structlog.get_logger()

_RETRY_DELAYS = [10, 30, 60]  # 재시도 대기(초)

# ANSI 이스케이프 코드 제거용 패턴
_ANSI_RE = re.compile(r"\x1b\[[0-9;]*[mGKHF]")


def _strip_ansi(text: str) -> str:
    return _ANSI_RE.sub("", text).strip()


def _call_claude_cli(prompt: str, system: str = "", model: str = "") -> str:
    """Claude CLI subprocess — OAuth 구독 방식 (API 키 불필요)"""
    model_name = model or settings.WRITER_MODEL

    # system 프롬프트는 user 메시지 앞에 컨텍스트로 삽입
    full_prompt = (
        f"<system_context>\n{system}\n</system_context>\n\n{prompt}"
        if system
        else prompt
    )

    cmd = [
        "claude",
        "-p", full_prompt,
        "--model", model_name,
    ]

    env = os.environ.copy()
    env.pop("ANTHROPIC_API_KEY", None)   # API 키 제거 → OAuth 토큰 사용
    env["CLAUDE_CONFIG_DIR"] = "/root/.claude"

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        env=env,
        timeout=120,
    )

    stderr = _strip_ansi(result.stderr or "")
    stdout = _strip_ansi(result.stdout or "")

    if result.returncode != 0:
        raise Exception(
            f"Claude CLI failed (exit {result.returncode}): {stderr or stdout}"
        )

    if not stdout:
        raise Exception(f"Claude CLI returned empty output. stderr: {stderr}")

    return stdout


async def _call_claude_cli_async(prompt: str, system: str = "", model: str = "") -> str:
    """비동기 Claude CLI 호출 — run_in_executor로 블로킹 subprocess 래핑"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _call_claude_cli, prompt, system, model
    )


class BaseAgent:
    """모든 에이전트의 기반 클래스 — Claude CLI (OAuth 구독 방식)"""

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
                return _call_claude_cli(
                    prompt=user_message,
                    system=self.system_prompt,
                    model=self.model_name,
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
                return await _call_claude_cli_async(
                    prompt=user_message,
                    system=self.system_prompt,
                    model=self.model_name,
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
