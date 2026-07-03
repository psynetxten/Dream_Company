"""
매일 오전 8시 KST 자동 발행 배치 작업.
APScheduler를 사용해 pending 상태의 스케줄을 처리합니다.
"""
import asyncio
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.schedule import PublicationSchedule
from app.models.order import Order
from app.models.newspaper import Newspaper
from app.agents.editor_in_chief.agent import EditorInChief
from app.agents.base_agent import reset_usage_tracking, get_usage_tracking
from app.config import settings
from app.models.user import User
from app.core import progress_store
import structlog

logger = structlog.get_logger()

# 글로벌 스케줄러 인스턴스
scheduler = AsyncIOScheduler(timezone=settings.PUBLISH_TIMEZONE)


async def process_single_schedule(
    db: AsyncSession,
    schedule: PublicationSchedule,
    orchestrator: EditorInChief,
    semaphore: asyncio.Semaphore,
):
    """단일 스케줄 처리"""
    async with semaphore:
        try:
            # 토큰 실측 집계 시작 (이 신문 1편 파이프라인 전체: 스폰서매칭+작성+요약+SNS)
            reset_usage_tracking()

            # 처리 중으로 상태 변경
            schedule.status = "processing"
            await db.flush()

            await progress_store.emit(
                str(schedule.order_id), "starting", "편집국이 꿈을 분석하고 있습니다"
            )

            # 의뢰 정보 로드
            order_result = await db.execute(
                select(Order).where(Order.id == schedule.order_id)
            )
            order = order_result.scalar_one_or_none()
            if not order:
                schedule.status = "failed"
                schedule.error_message = "Order not found"
                return

            # 이전 편 요약 로드
            previous_summary = None
            if schedule.episode_number > 1:
                prev_result = await db.execute(
                    select(Newspaper).where(
                        and_(
                            Newspaper.order_id == order.id,
                            Newspaper.episode_number == schedule.episode_number - 1,
                        )
                    )
                )
                prev_newspaper = prev_result.scalar_one_or_none()
                if prev_newspaper and prev_newspaper.sidebar_content:
                    previous_summary = prev_newspaper.sidebar_content.get("episode_summary", "")

            # 의뢰를 dict로 변환 (스폰서 매칭보다 먼저 생성해야 함)
            order_dict = {
                "id": str(order.id),
                "protagonist_name": order.protagonist_name,
                "dream_description": order.dream_description,
                "target_role": order.target_role,
                "target_company": order.target_company,
                "duration_days": order.duration_days,
                "future_year": order.future_year,
                "timezone": order.timezone,
                "publish_time": str(order.publish_time),
                "writer_type": order.writer_type,
            }

            # 스폰서 매칭: AdSales 에이전트로 최적 스폰서 선택
            sponsor_company = order.target_company
            sponsor_data = None
            try:
                matched = await orchestrator.ad_sales.find_sponsors(order_dict)
                if matched:
                    top = matched[0]
                    sponsor_company = top.get("company_name", order.target_company)
                    sponsor_data = top
                    logger.info("sponsor_matched_for_publish", company=sponsor_company)
            except Exception as e:
                logger.warning("sponsor_match_skipped", error=str(e))

            await progress_store.emit(
                str(schedule.order_id),
                "sponsor_matching",
                "맞춤 스폰서를 찾았습니다",
                sponsor_company=sponsor_company,
            )

            # 신문 생성 (품질 검수 루프 제거 — 직접 생성)
            # 품질 검수는 v2에서 규칙 기반(LLM 없이)으로 재도입 예정
            scheduled_date = schedule.scheduled_at.astimezone(ZoneInfo(order.timezone))

            await progress_store.emit(
                str(schedule.order_id), "writing", "기자단이 기사를 작성하고 있습니다"
            )

            newspaper_content = await orchestrator.generate_single_newspaper(
                order=order_dict,
                episode=schedule.episode_number,
                scheduled_date=scheduled_date,
                sponsor_company=sponsor_company,
                previous_summary=previous_summary,
            )

            # 토큰 실측 집계 읽기 (파이프라인 전체 합산)
            _usage = get_usage_tracking() or {"input": 0, "output": 0}

            # DB에 신문 저장
            newspaper = Newspaper(
                order_id=order.id,
                episode_number=schedule.episode_number,
                future_date=newspaper_content["future_date"],
                future_date_label=newspaper_content["future_date_label"],
                headline=newspaper_content.get("headline"),
                subhead=newspaper_content.get("subhead"),
                lead_paragraph=newspaper_content.get("lead_paragraph"),
                body_content=newspaper_content.get("body_content"),
                sidebar_content={
                    **newspaper_content.get("sidebar", {}),
                    "episode_summary": newspaper_content.get("episode_summary", ""),
                },
                raw_content=newspaper_content.get("raw_content"),
                variables_used={
                    "protagonist": order.protagonist_name,
                    "company": order.target_company,
                    "sponsor": sponsor_company,
                    "sponsor_industry": sponsor_data.get("industry", "") if sponsor_data else "",
                    "sponsor_reason": sponsor_data.get("reason", "") if sponsor_data else "",
                    "sponsor_is_paid": sponsor_data.get("is_paid", False) if sponsor_data else False,
                },
                ai_model=newspaper_content.get("ai_model"),
                generation_ms=newspaper_content.get("generation_ms"),
                token_count=_usage["input"] + _usage["output"],
                input_tokens=_usage["input"],
                output_tokens=_usage["output"],
                sns_copy=newspaper_content.get("sns_copy", {}),
                visual_prompt=newspaper_content.get("visual_prompt"),
                status="published",
                published_at=datetime.now(timezone.utc),
                scheduled_at=schedule.scheduled_at,
            )
            db.add(newspaper)
            await db.flush()

            # 스케줄 완료 처리
            schedule.status = "completed"
            schedule.newspaper_id = newspaper.id
            schedule.executed_at = datetime.now(timezone.utc)

            await progress_store.emit(
                str(schedule.order_id),
                "done",
                "신문이 완성됐습니다!",
                newspaper_id=str(newspaper.id),
                headline=newspaper_content.get("headline", ""),
                subhead=newspaper_content.get("subhead", ""),
                future_date_label=newspaper_content.get("future_date_label", ""),
                sponsor_company=sponsor_company,
            )

            logger.info(
                "newspaper_published",
                order_id=str(order.id),
                episode=schedule.episode_number,
                headline=newspaper.headline,
            )

            # 이메일 알림 발송
            try:
                user_result = await db.execute(select(User).where(User.id == order.user_id))
                user = user_result.scalar_one_or_none()
                if user and user.email and settings.RESEND_API_KEY:
                    from app.services.email_service import (
                        send_newspaper_published,
                        send_series_completed,
                    )
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(None, lambda: send_newspaper_published(
                        email=user.email,
                        full_name=user.full_name,
                        headline=newspaper.headline or "새 신문이 도착했습니다",
                        episode_number=schedule.episode_number,
                        total_episodes=order.duration_days,
                        newspaper_id=str(newspaper.id),
                    ))
                    # 마지막 화 발행 시 시리즈 완료 메일도 발송
                    if schedule.episode_number >= order.duration_days:
                        await loop.run_in_executor(None, lambda: send_series_completed(
                            email=user.email,
                            full_name=user.full_name,
                            duration_days=order.duration_days,
                        ))
            except Exception as e:
                logger.warning("email_notification_failed", error=str(e))

        except Exception as e:
            schedule.status = "failed"
            schedule.error_message = str(e)
            schedule.retry_count += 1
            logger.error(
                "newspaper_publish_failed",
                schedule_id=str(schedule.id),
                episode=schedule.episode_number,
                error=str(e),
            )


async def daily_publication_job():
    """매일 8시 실행되는 발행 배치 작업"""
    logger.info("daily_publication_job_start")

    async with get_db_session() as db:
        # 오늘 발행 예정인 pending 스케줄 조회
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(PublicationSchedule).where(
                and_(
                    PublicationSchedule.status == "pending",
                    PublicationSchedule.scheduled_at <= now,
                    PublicationSchedule.retry_count < 3,
                )
            )
        )
        pending_schedules = result.scalars().all()

        if not pending_schedules:
            logger.info("daily_publication_no_pending")
            return

        logger.info("daily_publication_processing", count=len(pending_schedules))

        orchestrator = EditorInChief()
        semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_GENERATIONS)

        tasks = [
            process_single_schedule(db, schedule, orchestrator, semaphore)
            for schedule in pending_schedules
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 실패 카운트
        failures = sum(1 for r in results if isinstance(r, Exception))
        logger.info(
            "daily_publication_job_done",
            total=len(pending_schedules),
            failures=failures,
        )


def setup_scheduler():
    """스케줄러 설정 및 시작"""
    scheduler.add_job(
        daily_publication_job,
        trigger=CronTrigger(
            hour=settings.PUBLISH_HOUR,
            minute=settings.PUBLISH_MINUTE,
            timezone=settings.PUBLISH_TIMEZONE,
        ),
        id="daily_publication",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()
    logger.info(
        "scheduler_started",
        publish_time=f"{settings.PUBLISH_HOUR:02d}:{settings.PUBLISH_MINUTE:02d} {settings.PUBLISH_TIMEZONE}",
    )
    return scheduler


def shutdown_scheduler():
    """스케줄러 종료"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("scheduler_stopped")
