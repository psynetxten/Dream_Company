import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.agents.base_agent import BaseAgent
from app.agents.writer.writer_agent import WriterAgent
from app.agents.sponsor_matcher.sponsor_agent import SponsorMatcherAgent
from app.agents.marketing_expert.agent import MarketingExpert
from app.agents.content_producer.agent import ContentProducer
from app.agents.orchestrator.prompts import ORCHESTRATOR_SYSTEM_PROMPT
from app.config import settings
import structlog

logger = structlog.get_logger()


class OrchestratorAgent(BaseAgent):
    """
    메인 오케스트레이터 에이전트
    - 새 의뢰 접수 → 스폰서 매칭 + 작가 배정 (병렬)
    - 발행 스케줄 생성
    - 신문 생성 및 품질 검토
    """

    def __init__(self):
        super().__init__(
            model=settings.ORCHESTRATOR_MODEL,
            max_tokens=4096,
            system_prompt=ORCHESTRATOR_SYSTEM_PROMPT,
            agent_name="orchestrator",
        )
        self.writer_agent = WriterAgent()
        self.sponsor_agent = SponsorMatcherAgent()
        self.marketing_expert = MarketingExpert()  # 마케팅 팀장
        self.content_producer = ContentProducer()  # 콘텐츠 디렉터

    def process_new_order(self, order: dict) -> dict:
        """
        새 의뢰 전체 파이프라인 실행

        Args:
            order: {
                id, user_id, protagonist_name, dream_description,
                target_role, target_company, duration_days, future_year,
                payment_type, timezone
            }

        Returns:
            {order_id, sponsors, schedule, writer_type, status}
        """
        order_id = str(order.get("id", uuid.uuid4()))
        logger.info("orchestrator_new_order", order_id=order_id)

        # 1. 스폰서 매칭 (ChromaDB + Claude)
        try:
            sponsors = self.sponsor_agent.find_sponsors(order)
            logger.info("sponsors_matched", order_id=order_id, count=len(sponsors))
        except Exception as e:
            logger.error("sponsor_match_error", order_id=order_id, error=str(e))
            sponsors = []

        # 2. 발행 스케줄 생성
        schedule = self._create_publication_schedule(order)

        # 3. 작가 배정 (MVP: 항상 AI)
        writer_assignment = self._assign_writer(order)

        logger.info(
            "orchestrator_order_processed",
            order_id=order_id,
            schedule_count=len(schedule),
            writer_type=writer_assignment["type"],
        )

        return {
            "order_id": order_id,
            "sponsors": sponsors,
            "schedule": schedule,
            "writer_type": writer_assignment["type"],
            "assigned_writer_id": writer_assignment.get("writer_id"),
            "status": "active",
        }

    async def generate_single_newspaper(
        self,
        order: dict,
        episode: int,
        scheduled_date: datetime,
        sponsor_company: str = None,
        previous_summary: str = None,
    ) -> dict:
        """
        단일 신문 편 생성

        Args:
            order: 의뢰 정보
            episode: 에피소드 번호
            scheduled_date: 발행 예정일
            sponsor_company: 스폰서 회사명 (선택)
            previous_summary: 이전 편 요약 (선택)

        Returns:
            신문 콘텐츠 dict
        """
        # 미래 날짜 계산
        future_year = order.get("future_year", 2030)
        years_ahead = future_year - scheduled_date.year
        future_date = scheduled_date.replace(year=scheduled_date.year + years_ahead)

        weekdays_kr = ["월", "화", "수", "목", "금", "토", "일"]
        future_date_label = (
            f"{future_date.year}년 {future_date.month}월 "
            f"{future_date.day}일 "
            f"{weekdays_kr[future_date.weekday()]}요일"
        )

        order_context = {
            "protagonist_name": order["protagonist_name"],
            "dream_description": order["dream_description"],
            "target_role": order["target_role"],
            "target_company": order.get("target_company", ""),
            "future_date_label": future_date_label,
            "total_episodes": order["duration_days"],
            "sponsor_company": sponsor_company,
            "previous_summary": previous_summary,
        }

        newspaper_content = self.writer_agent.generate_newspaper(order_context, episode)

        # 연속성을 위한 요약 생성
        summary = self.writer_agent.summarize_episode(newspaper_content)

        # [마케팅 팀장] SNS 홍보 문구 생성
        full_text = f"{newspaper_content.get('headline')}\n{newspaper_content.get('body_content')}"
        
        sns_copy = await self.marketing_expert.generate_sns_copy(full_text)
        visual_prompt = await self.content_producer.generate_visual_prompt(full_text)

        return {
            **newspaper_content,
            "episode_number": episode,
            "future_date": future_date.date(),
            "future_date_label": future_date_label,
            "episode_summary": summary,
            "sns_copy": sns_copy,
            "visual_prompt": visual_prompt,
        }

    def _create_publication_schedule(self, order: dict) -> list[dict]:
        """발행 스케줄 생성"""
        tz = ZoneInfo(order.get("timezone", "Asia/Seoul"))
        duration_days = order["duration_days"]
        publish_hour = int(str(order.get("publish_time", "08:00:00")).split(":")[0])

        # 내일부터 시작
        start_date = datetime.now(tz).replace(
            hour=publish_hour, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)

        schedule = []
        for i in range(duration_days):
            scheduled_at = start_date + timedelta(days=i)
            schedule.append({
                "episode": i + 1,
                "scheduled_at": scheduled_at.isoformat(),
                "future_date": scheduled_at.date().isoformat(),
                "status": "pending",
            })

        return schedule

    def _assign_writer(self, order: dict) -> dict:
        """
        작가 배정
        MVP: 항상 AI 작가
        Phase 2: 인간 작가 배정 로직 추가
        """
        return {
            "type": "ai",
            "writer_id": None,
            "model": settings.WRITER_MODEL,
        }

    def review_newspaper_quality(self, newspaper: dict) -> dict:
        """
        신문 품질 검토 (선택적 - sonnet 모델 사용)

        Returns:
            {"approved": bool, "feedback": str, "score": float}
        """
        prompt = f"""
다음 꿈신문 기사의 품질을 검토해주세요.

헤드라인: {newspaper.get('headline', '')}
서브헤드: {newspaper.get('subhead', '')}
리드: {newspaper.get('lead_paragraph', '')}
본문 (앞부분): {str(newspaper.get('body_content', ''))[:300]}

검토 기준:
1. 현재진행형으로 작성됐는가? (미래형 표현 없는지)
2. 주인공 실명이 자연스럽게 포함됐는가?
3. 생생하고 긍정적인 톤인가?
4. 신문 형식에 맞는가?

JSON으로 반환:
{{"approved": true/false, "score": 0.0-1.0, "feedback": "간단한 피드백"}}
"""
        try:
            content_text = self.run_sync(prompt)
            import json
            start = content_text.find("{")
            end = content_text.rfind("}") + 1
            if start != -1:
                return json.loads(content_text[start:end])
        except Exception as e:
            logger.error("quality_review_failed", error=str(e))

        return {"approved": True, "score": 0.8, "feedback": "자동 승인"}
