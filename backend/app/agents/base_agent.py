import time
import anthropic
from typing import Any, Callable, Awaitable
from app.config import settings
import structlog

logger = structlog.get_logger()


class BaseAgent:
    """모든 에이전트의 기반 클래스 - 도구 호출 루프 포함"""

    def __init__(
        self,
        model: str = None,
        max_tokens: int = 4096,
        system_prompt: str = "",
        agent_name: str = "base",
    ):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = model or settings.WRITER_MODEL
        self.max_tokens = max_tokens
        self.system_prompt = system_prompt
        self.agent_name = agent_name

    def run_sync(self, user_message: str, tools: list = None) -> anthropic.types.Message:
        """동기 단일 실행 (도구 없음)"""
        kwargs: dict[str, Any] = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "system": self.system_prompt,
            "messages": [{"role": "user", "content": user_message}],
        }
        if tools:
            kwargs["tools"] = tools

        return self.client.messages.create(**kwargs)

    def run_with_tools_sync(
        self,
        user_message: str,
        tools: list,
        tool_executor: Callable[[str, dict], Any],
        max_iterations: int = 10,
    ) -> str:
        """도구 호출 루프 포함 동기 실행"""
        messages = [{"role": "user", "content": user_message}]
        start_time = time.time()
        iterations = 0

        while iterations < max_iterations:
            iterations += 1
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=self.system_prompt,
                tools=tools,
                messages=messages,
            )

            if response.stop_reason == "end_turn":
                # 최종 텍스트 반환
                for block in response.content:
                    if hasattr(block, "text"):
                        duration_ms = int((time.time() - start_time) * 1000)
                        logger.info(
                            "agent_completed",
                            agent=self.agent_name,
                            iterations=iterations,
                            duration_ms=duration_ms,
                        )
                        return block.text
                return ""

            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                tool_results = []

                for block in response.content:
                    if block.type == "tool_use":
                        logger.debug(
                            "tool_called",
                            agent=self.agent_name,
                            tool=block.name,
                            input=block.input,
                        )
                        try:
                            result = tool_executor(block.name, block.input)
                        except Exception as e:
                            result = f"Error: {str(e)}"

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result),
                        })

                messages.append({"role": "user", "content": tool_results})

        raise RuntimeError(f"에이전트 최대 반복 횟수 초과: {max_iterations}")

    def get_usage(self, response: anthropic.types.Message) -> dict:
        """토큰 사용량 추출"""
        return {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "model": response.model,
        }
