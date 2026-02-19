import json
import time
import re
from app.agents.base_agent import BaseAgent
from app.agents.writer.prompts import WRITER_SYSTEM_PROMPT, build_writer_prompt
from app.config import settings
import structlog

logger = structlog.get_logger()


class WriterAgent(BaseAgent):
    """신문 1편 생성 에이전트 - claude-haiku (저비용 대량 생성)"""

    def __init__(self):
        super().__init__(
            model=settings.WRITER_MODEL,
            max_tokens=3000,
            system_prompt=WRITER_SYSTEM_PROMPT,
            agent_name="writer",
        )

    def generate_newspaper(self, order_context: dict, episode: int) -> dict:
        """
        신문 1편 생성

        Args:
            order_context: {
                protagonist_name, dream_description, target_role,
                target_company, future_date_label, total_episodes,
                sponsor_company (optional), previous_summary (optional)
            }
            episode: 현재 에피소드 번호

        Returns:
            {headline, subhead, lead_paragraph, body_content, sidebar,
             ai_model, generation_ms, token_count}
        """
        start_time = time.time()
        prompt = build_writer_prompt(order_context, episode)

        logger.info(
            "writer_agent_start",
            protagonist=order_context.get("protagonist_name"),
            episode=episode,
            total=order_context.get("total_episodes"),
        )

        # 1차 시도
        content_text = self.run_sync(prompt)

        # JSON 파싱 시도
        parsed = self._parse_json_response(content_text)

        # 파싱 실패 시 재시도
        if not parsed:
            logger.warning("writer_json_parse_failed_retrying", episode=episode)
            parsed = self._retry_with_explicit_json(order_context, episode)

        generation_ms = int((time.time() - start_time) * 1000)
        token_count = 0  # Gemini SDK에서 간편하게 가져오는 기능 추가 전까지 0으로 유지

        logger.info(
            "writer_agent_done",
            episode=episode,
            generation_ms=generation_ms,
        )

        return {
            **parsed,
            "ai_model": self.model_name,
            "generation_ms": generation_ms,
            "token_count": token_count,
            "raw_content": content_text,
        }

    def _parse_json_response(self, text: str) -> dict | None:
        """응답에서 JSON 파싱"""
        if not text:
            return None

        # 직접 파싱 시도
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # 코드블록에서 JSON 추출
        json_pattern = r"```(?:json)?\s*(\{.*?\})\s*```"
        match = re.search(json_pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        # 중괄호 범위 추출
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass

        return None

    def _retry_with_explicit_json(self, order_context: dict, episode: int) -> dict:
        """JSON 형식 명시적 재시도"""
        retry_prompt = f"""
이전 요청에서 JSON 형식으로 반환하지 않았습니다.
반드시 다음 형식의 JSON만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.

주인공: {order_context['protagonist_name']}
목표 회사: {order_context.get('target_company', '')}
날짜: {order_context.get('future_date_label', '')}

{{
  "headline": "20자 이내 헤드라인",
  "subhead": "40자 이내 서브헤드",
  "lead_paragraph": "3-4문장 리드 문단",
  "body_content": "본문 600-800자",
  "sidebar": {{"quote": "주인공의 말", "stats": [{{"label": "지표명", "value": "수치"}}]}}
}}
"""
        content_text = self.run_sync(retry_prompt)
        parsed = self._parse_json_response(content_text)
        if parsed:
            return parsed

        # 최후의 수단: 기본 구조 반환
        return {
            "headline": f"{order_context['protagonist_name']}, 꿈을 현실로 만들다",
            "subhead": f"{order_context.get('target_company', '')}에서 새 역사 쓰는 중",
            "lead_paragraph": f"{order_context['protagonist_name']}이 {order_context['target_role']}로서 놀라운 성과를 거두고 있다.",
            "body_content": f"{order_context['protagonist_name']}은 {order_context.get('future_date_label', '오늘')} 기준으로 탁월한 성과를 이루며 주목받고 있다.",
            "sidebar": {"quote": "매일이 새로운 도전입니다.", "stats": [{"label": "성장률", "value": "143%"}]},
        }

    def summarize_episode(self, newspaper_content: dict) -> str:
        """이전 편 요약 생성 (다음 편 연속성용)"""
        prompt = f"""
다음 신문 기사를 3문장으로 요약해주세요. 다음 편 작성 시 연속성을 위한 맥락 정보입니다.

헤드라인: {newspaper_content.get('headline', '')}
본문: {newspaper_content.get('body_content', '')[:500]}

3문장 요약:
"""
        summary = self.run_sync(prompt)
        return summary.strip()
