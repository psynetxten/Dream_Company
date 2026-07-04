"""
외부 크론 트리거 엔드포인트.

Render 무료 티어 웹 서비스는 15분 유휴 시 슬립된다. 그러면 in-process
APScheduler(매일 08:00 KST 발행)가 정각에 돌지 못하고, 놓친 발행은 재실행되지
않는다. 이를 무료로 해결하기 위해 외부 스케줄러(GitHub Actions 크론)가 매일
08:00 KST에 이 엔드포인트를 호출한다. 요청 자체가 서비스를 깨우고, 배치는
scheduled_at <= now 인 모든 pending 스케줄을 처리하므로 밀린 발행분까지 함께
따라잡는다(멱등).
"""
from fastapi import APIRouter, Header, HTTPException
from app.tasks.daily_publish import daily_publication_job
from app.config import settings
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/cron", tags=["cron"])


@router.post("/publish")
async def trigger_publish(x_cron_secret: str | None = Header(default=None)):
    """발행 배치를 즉시 실행(밀린 pending 스케줄 전부 따라잡기).

    보안: CRON_SECRET 미설정 시 비활성(403). 헤더 X-Cron-Secret 일치 필요.
    """
    if not settings.CRON_SECRET or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=403, detail="forbidden")

    logger.info("cron_publish_triggered")
    await daily_publication_job()
    return {"status": "ok"}
