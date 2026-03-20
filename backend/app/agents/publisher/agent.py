"""
Publisher - APScheduler 래퍼 에이전트
매일 08:00 KST 자동 발행 스케줄 관리
"""
from app.tasks.daily_publish import setup_scheduler, shutdown_scheduler, scheduler
import structlog

logger = structlog.get_logger()


class Publisher:
    """Publisher (발행 담당) — APScheduler 래핑, 매일 08:00 KST 자동 발행"""

    def __init__(self):
        self.agent_name = "publisher"
        self._scheduler = None

    def start(self):
        """스케줄러 시작 (앱 startup 시 호출)"""
        self._scheduler = setup_scheduler()
        logger.info("scheduler_agent_started")

    def stop(self):
        """스케줄러 종료 (앱 shutdown 시 호출)"""
        shutdown_scheduler()
        logger.info("scheduler_agent_stopped")

    def is_running(self) -> bool:
        return scheduler.running

    def get_next_run_time(self) -> str | None:
        """다음 발행 예정 시각 반환"""
        job = scheduler.get_job("daily_publication")
        if job and job.next_run_time:
            return job.next_run_time.isoformat()
        return None

    def get_status(self) -> dict:
        return {
            "running": self.is_running(),
            "next_run": self.get_next_run_time(),
            "agent": self.agent_name,
        }
