"""
HRManager - 작가 배정 관리자
- AI vs 인간 작가 선택 결정 (LLM 기반)
- 인간 작가 전문분야 매칭 + 부하 분산 배정
- 인간 작가용 AI 초안 생성
- 작가 업무량 현황 모니터링
"""
import json
import uuid
import structlog
from google import genai
from google.genai import types
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.config import settings

logger = structlog.get_logger()

# 전문분야 → 직업 키워드 매핑
SPECIALTY_MAP = {
    "career":    ["개발자", "엔지니어", "cto", "pm", "기획자", "데이터", "ai", "researcher",
                  "architect", "designer", "ux", "devops", "sre"],
    "life":      ["작가", "유튜버", "크리에이터", "노마드", "여행", "라이프스타일", "블로거"],
    "medical":   ["의사", "간호사", "surgeon", "의료", "헬스케어", "약사", "치과", "한의사"],
    "business":  ["ceo", "창업", "스타트업", "마케터", "투자", "finance", "회계", "컨설턴트"],
    "education": ["교사", "교수", "강사", "코치", "멘토", "튜터", "강연"],
    "sports":    ["운동선수", "트레이너", "감독", "코치", "스포츠", "선수"],
    "arts":      ["화가", "음악가", "뮤지션", "배우", "감독", "촬영", "작곡가"],
    "science":   ["과학자", "연구원", "물리", "화학", "생물", "천문", "우주"],
}


class HRManager:
    """HR Manager (인사 담당) — AI/인간 작가 배정 결정 및 관리

    담당 업무:
    1. decide_writer_type  - 의뢰 분석 후 AI / 인간 배정 결정
    2. find_best_writer    - 인간 작가 후보 중 최적 작가 선택 + current_order_count 증가
    3. generate_ai_draft   - 인간 작가용 편집 초안 자동 생성
    4. get_workload_status - 전체 작가 업무량 현황 조회
    5. release_writer      - 의뢰 완료/취소 시 작가 슬롯 반납
    """

    def __init__(self):
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.WRITER_MODEL
        self.agent_name = "hr-manager"

    # ─────────────────────────────────────────────────────────
    # 1. AI vs 인간 작가 선택 결정
    # ─────────────────────────────────────────────────────────
    async def decide_writer_type(self, order: dict) -> str:
        """
        의뢰 내용을 분석해 'ai' 또는 'human' 반환.

        인간 작가 우선 조건:
        - subscription 상품 (고가)
        - 30일 장기 시리즈
        - 감성적/문학적 꿈 설명
        """
        prompt = f"""
당신은 꿈신문사의 작가 배정 담당자입니다.
아래 의뢰를 분석해 AI 작가와 인간 작가 중 어느 쪽이 적합한지 판단하세요.

[의뢰 정보]
- 꿈 설명: {order.get('dream_description', '')}
- 목표 역할: {order.get('target_role', '')}
- 시리즈 기간: {order.get('duration_days', 7)}일
- 결제 유형: {order.get('payment_type', 'one_time')}

[판단 기준]
- ai: 7/14일 단기, one_time 결제, 명확한 커리어 목표
- human: 30일 장기, subscription 결제, 감성적/문학적 서술이 중요한 꿈

반드시 "ai" 또는 "human" 한 단어만 반환하세요.
"""
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            result = response.text.strip().lower()
            writer_type = "human" if "human" in result else "ai"
            logger.info("writer_type_decided", writer_type=writer_type, order_id=order.get("id"))
            return writer_type
        except Exception as e:
            logger.error("decide_writer_type_failed", error=str(e))
            return "ai"

    # ─────────────────────────────────────────────────────────
    # 2. 인간 작가 최적 매칭 + 배정
    # ─────────────────────────────────────────────────────────
    async def find_best_writer(self, order: dict) -> dict | None:
        """
        가용 작가 중 전문분야 매칭 + 부하 분산으로 최적 작가 선택.
        배정 시 current_order_count를 증가시킨다.

        Returns:
            {"writer_id": str, "pen_name": str, "score": float, "ai_assist_level": str}
            또는 None (가용 작가 없음)
        """
        try:
            from app.models.writer import WriterProfile
            from app.models.user import User

            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(WriterProfile, User)
                    .join(User, WriterProfile.user_id == User.id)
                    .where(
                        and_(
                            WriterProfile.is_available == True,
                            User.is_active == True,
                        )
                    )
                )
                candidates = result.all()

                # 부하 초과 작가 필터
                available = [
                    (p, u) for p, u in candidates
                    if p.current_order_count < p.max_concurrent_orders
                ]

                if not available:
                    logger.warning("writer_manager_no_capacity")
                    return None

                # 전문분야 매칭 점수 계산
                search_text = (
                    f"{order.get('target_role', '')} "
                    f"{order.get('dream_description', '')}"
                ).lower()

                def score_writer(profile) -> float:
                    specialties = profile.specialties or []
                    match_score = 0.0
                    for specialty in specialties:
                        kws = SPECIALTY_MAP.get(specialty, [specialty])
                        for kw in kws:
                            if kw.lower() in search_text:
                                match_score += 0.3
                        if specialty.lower() in search_text:
                            match_score += 0.1

                    # 부하 낮을수록 우선 (0~0.2 가산)
                    load_factor = 1 - (profile.current_order_count / max(profile.max_concurrent_orders, 1))
                    return match_score + load_factor * 0.2

                ranked = sorted(available, key=lambda x: -score_writer(x[0]))
                best_profile, best_user = ranked[0]
                final_score = round(score_writer(best_profile), 2)

                # 배정 확정 → current_order_count 증가
                best_profile.current_order_count += 1
                await session.commit()

                logger.info(
                    "writer_manager_matched",
                    writer_id=str(best_user.id),
                    pen_name=best_profile.pen_name,
                    score=final_score,
                    order_id=order.get("id"),
                )

                return {
                    "writer_id": str(best_user.id),
                    "pen_name": best_profile.pen_name or best_user.full_name,
                    "score": final_score,
                    "ai_assist_level": best_profile.ai_assist_level,
                }

        except Exception as e:
            logger.error("writer_manager_failed", error=str(e))
            return None

    # ─────────────────────────────────────────────────────────
    # 3. 인간 작가용 AI 편집 초안 생성
    # ─────────────────────────────────────────────────────────
    async def generate_ai_draft(self, order: dict, episode: int) -> dict:
        """
        인간 작가가 편집할 초안 생성.
        [편집 필요], [수치 입력] 태그로 편집 포인트를 명시한다.
        """
        prompt = f"""
당신은 꿈신문사의 초안 보조 작가입니다.
인간 작가가 다듬기 쉽도록 초안을 작성하세요. 수정이 필요한 부분은 [편집 필요] 또는 [수치 입력] 태그를 달아주세요.

[의뢰]
- 주인공: {order.get('protagonist_name')}
- 꿈: {order.get('dream_description')}
- 목표 직업: {order.get('target_role')}
- 목표 회사: {order.get('target_company', '미정')}
- 에피소드: {episode}편 / {order.get('duration_days', 7)}편

반드시 아래 JSON 형식으로만 반환하세요:
{{
  "headline": "제목 초안",
  "subhead": "서브헤드 초안",
  "lead_paragraph": "리드 문단 초안",
  "body_content": "본문 초안",
  "sidebar": {{
    "quote": "주인공 인용구 [편집 필요]",
    "stats": [{{"label": "지표명", "value": "[수치 입력]"}}]
  }}
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
            draft = json.loads(response.text)
            draft["is_ai_draft"] = True
            draft["ai_assist_note"] = "[AI 초안] 인간 작가 검토 및 편집이 필요합니다."
            logger.info("ai_draft_generated", episode=episode, order_id=order.get("id"))
            return draft
        except Exception as e:
            logger.error("ai_draft_generation_failed", error=str(e))
            return {
                "headline": f"[편집 필요] {order.get('protagonist_name')}의 {episode}번째 이야기",
                "subhead": "[서브헤드를 입력하세요]",
                "lead_paragraph": "[리드 문단을 작성하세요]",
                "body_content": "[본문을 작성하세요. 현재진행형으로 생생하게!]",
                "sidebar": {"quote": "[인용구 입력]", "stats": []},
                "is_ai_draft": True,
                "ai_assist_note": "[AI 초안 생성 실패 - 직접 작성하세요]",
            }

    # ─────────────────────────────────────────────────────────
    # 4. 전체 작가 업무량 현황
    # ─────────────────────────────────────────────────────────
    async def get_workload_status(self) -> list[dict]:
        """모든 작가의 현재 업무량과 가용 여부 반환"""
        try:
            from app.models.writer import WriterProfile
            from app.models.user import User

            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(WriterProfile, User).join(User, WriterProfile.user_id == User.id)
                )
                rows = result.all()

            return [
                {
                    "writer_id": str(wp.user_id),
                    "pen_name": wp.pen_name or u.full_name,
                    "email": u.email,
                    "is_available": wp.is_available,
                    "current_orders": wp.current_order_count,
                    "max_orders": wp.max_concurrent_orders,
                    "capacity_pct": round(
                        wp.current_order_count / max(wp.max_concurrent_orders, 1) * 100
                    ),
                    "specialties": wp.specialties or [],
                    "avg_rating": float(wp.avg_rating) if wp.avg_rating else None,
                    "ai_assist_level": wp.ai_assist_level,
                }
                for wp, u in rows
            ]
        except Exception as e:
            logger.error("get_workload_status_failed", error=str(e))
            return []

    # ─────────────────────────────────────────────────────────
    # 5. 의뢰 완료/취소 시 작가 슬롯 반납
    # ─────────────────────────────────────────────────────────
    async def release_writer(self, writer_id: str) -> None:
        """작가의 current_order_count를 1 감소"""
        try:
            from app.models.writer import WriterProfile

            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(WriterProfile).where(
                        WriterProfile.user_id == uuid.UUID(writer_id)
                    )
                )
                profile = result.scalar_one_or_none()
                if profile and profile.current_order_count > 0:
                    profile.current_order_count -= 1
                    await session.commit()
                    logger.info("writer_slot_released", writer_id=writer_id)
        except Exception as e:
            logger.error("writer_manager_release_failed", error=str(e))

    # ─────────────────────────────────────────────────────────
    # 6. 작가 평점 업데이트
    # ─────────────────────────────────────────────────────────
    async def update_writer_rating(self, writer_id: str, new_rating: float) -> None:
        """사용자 리뷰 후 avg_rating / total_reviews 업데이트 (누적 평균)"""
        try:
            from app.models.writer import WriterProfile

            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(WriterProfile).where(
                        WriterProfile.user_id == uuid.UUID(writer_id)
                    )
                )
                profile = result.scalar_one_or_none()
                if profile:
                    total = (profile.total_reviews or 0) + 1
                    prev_avg = float(profile.avg_rating or 0)
                    profile.avg_rating = round((prev_avg * (total - 1) + new_rating) / total, 2)
                    profile.total_reviews = total
                    await session.commit()
                    logger.info("writer_rating_updated", writer_id=writer_id, new_avg=profile.avg_rating)
        except Exception as e:
            logger.error("update_writer_rating_failed", error=str(e))

    # ─────────────────────────────────────────────────────────
    # 7. 작가 가용 여부 전환 (휴가·복귀)
    # ─────────────────────────────────────────────────────────
    async def set_writer_availability(self, writer_id: str, is_available: bool) -> None:
        """작가 휴가·복귀 시 is_available 플래그 전환"""
        try:
            from app.models.writer import WriterProfile

            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(WriterProfile).where(
                        WriterProfile.user_id == uuid.UUID(writer_id)
                    )
                )
                profile = result.scalar_one_or_none()
                if profile:
                    profile.is_available = is_available
                    await session.commit()
                    logger.info("writer_availability_set", writer_id=writer_id, is_available=is_available)
        except Exception as e:
            logger.error("set_writer_availability_failed", error=str(e))

    # ─────────────────────────────────────────────────────────
    # 8. 신규 작가 온보딩 (작가 포털 3001 연결)
    # ─────────────────────────────────────────────────────────
    async def register_writer(self, user_id: str, profile_data: dict) -> dict:
        """
        신규 작가 WriterProfile 생성 — 작가 포털(port 3001) 회원가입 연결

        Args:
            user_id: 기존 users 테이블 UUID
            profile_data: {pen_name, bio, specialties, max_concurrent_orders, ai_assist_level}

        Returns:
            {"success": bool, "writer_id": str, "pen_name": str}
        """
        try:
            from app.models.writer import WriterProfile

            async with AsyncSessionLocal() as session:
                profile = WriterProfile(
                    user_id=uuid.UUID(user_id),
                    pen_name=profile_data.get("pen_name"),
                    bio=profile_data.get("bio", ""),
                    specialties=profile_data.get("specialties", []),
                    max_concurrent_orders=profile_data.get("max_concurrent_orders", 3),
                    ai_assist_level=profile_data.get("ai_assist_level", "assisted"),
                    is_available=True,
                    current_order_count=0,
                )
                session.add(profile)
                await session.commit()
                await session.refresh(profile)
                logger.info("writer_registered", writer_id=user_id, pen_name=profile.pen_name)
                return {"success": True, "writer_id": user_id, "pen_name": profile.pen_name}
        except Exception as e:
            logger.error("register_writer_failed", error=str(e))
            return {"success": False, "writer_id": user_id, "pen_name": None}
