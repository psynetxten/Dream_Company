"""
이메일 서비스 — Resend API 사용
신문 발행 알림, 가입 환영, 시리즈 완료 등
"""
import resend
from app.config import settings
import structlog

logger = structlog.get_logger()


def _send(to: str, subject: str, html: str) -> bool:
    """Resend로 이메일 발송. 실패해도 예외 전파 안 함."""
    if not settings.RESEND_API_KEY:
        logger.warning("email_skipped_no_api_key", to=to, subject=subject)
        return False

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
            "to": to,
            "subject": subject,
            "html": html,
        })
        logger.info("email_sent", to=to, subject=subject)
        return True
    except Exception as e:
        logger.error("email_send_failed", to=to, error=str(e))
        return False


def send_newspaper_published(
    email: str,
    full_name: str,
    headline: str,
    episode_number: int,
    total_episodes: int,
    newspaper_id: str,
) -> bool:
    """신문 1편 발행 알림"""
    frontend_url = settings.FRONTEND_URL
    read_url = f"{frontend_url}/newspapers/{newspaper_id}"

    progress_bar = "■" * episode_number + "□" * (total_episodes - episode_number)

    html = f"""
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8">
<style>
  body {{ font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 20px; }}
  .wrapper {{ max-width: 600px; margin: 0 auto; background: #fffef9; border: 2px solid #1a1a1a; }}
  .masthead {{ background: #1a1a1a; color: #f5f0e8; padding: 24px; text-align: center; }}
  .masthead h1 {{ font-size: 32px; font-weight: 900; letter-spacing: 4px; margin: 0 0 4px; }}
  .masthead p {{ font-size: 11px; letter-spacing: 2px; opacity: 0.6; margin: 0; }}
  .content {{ padding: 32px; }}
  .episode-badge {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
                    color: #666; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 16px; }}
  .headline {{ font-size: 24px; font-weight: 900; line-height: 1.3; margin-bottom: 20px; color: #1a1a1a; }}
  .progress {{ font-family: monospace; font-size: 13px; color: #666; margin-bottom: 24px; }}
  .cta {{ display: inline-block; background: #1a1a1a; color: #f5f0e8; padding: 14px 32px;
          font-weight: 700; text-decoration: none; letter-spacing: 2px; font-size: 13px;
          text-transform: uppercase; }}
  .footer {{ border-top: 1px solid #ccc; padding: 16px 32px; font-size: 11px; color: #999;
             text-align: center; font-family: sans-serif; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="masthead">
    <h1>꿈신문사</h1>
    <p>DREAM NEWSPAPER · 매일 오전 8시 발행</p>
  </div>
  <div class="content">
    <div class="episode-badge">
      {full_name}님의 꿈신문 &nbsp;·&nbsp; 제{episode_number}호 / 총 {total_episodes}호
    </div>
    <div class="headline">"{headline}"</div>
    <div class="progress">
      연재 진행 [{progress_bar}] {episode_number}/{total_episodes}
    </div>
    <a href="{read_url}" class="cta">오늘의 신문 읽기 →</a>
  </div>
  <div class="footer">
    꿈신문사 &nbsp;·&nbsp; 구독을 원하지 않으시면 대시보드에서 설정하세요.
  </div>
</div>
</body>
</html>
"""
    return _send(
        to=email,
        subject=f"[꿈신문사] {full_name}님, 제{episode_number}호 신문이 도착했습니다",
        html=html,
    )


def send_series_completed(email: str, full_name: str, duration_days: int) -> bool:
    """시리즈 완료 알림"""
    html = f"""
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8">
<style>
  body {{ font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 20px; }}
  .wrapper {{ max-width: 600px; margin: 0 auto; background: #fffef9; border: 2px solid #1a1a1a; }}
  .masthead {{ background: #1a1a1a; color: #f5f0e8; padding: 24px; text-align: center; }}
  .masthead h1 {{ font-size: 32px; font-weight: 900; letter-spacing: 4px; margin: 0 0 4px; }}
  .content {{ padding: 32px; text-align: center; }}
  .big {{ font-size: 48px; margin-bottom: 16px; }}
  .title {{ font-size: 22px; font-weight: 900; margin-bottom: 12px; }}
  .desc {{ color: #666; font-size: 14px; line-height: 1.8; margin-bottom: 28px; }}
  .cta {{ display: inline-block; background: #1a1a1a; color: #f5f0e8; padding: 14px 32px;
          font-weight: 700; text-decoration: none; letter-spacing: 2px; font-size: 13px;
          text-transform: uppercase; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="masthead"><h1>꿈신문사</h1></div>
  <div class="content">
    <div class="big">✦</div>
    <div class="title">{full_name}님의 {duration_days}일 시리즈가 완결되었습니다</div>
    <p class="desc">
      {duration_days}일 동안 꿈이 현실인 세계를 살아보셨습니다.<br>
      그 꿈은 여전히 유효합니다.<br>
      새로운 시리즈로 더 깊이 들어가 보세요.
    </p>
    <a href="{settings.FRONTEND_URL}/order/new" class="cta">새 시리즈 시작하기 →</a>
  </div>
</div>
</body>
</html>
"""
    return _send(
        to=email,
        subject=f"[꿈신문사] {full_name}님의 {duration_days}일 여정이 완결되었습니다",
        html=html,
    )
