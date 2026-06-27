"""
PortOne(아임포트) v2 결제 검증 서비스.

프론트에서 PortOne SDK로 결제 후 받은 paymentId를 백엔드가 PortOne API로
다시 조회해 '실제로 결제됐고 금액이 맞는지'를 서버에서 검증한다.
(클라이언트가 보낸 결제 성공 신호는 절대 신뢰하지 않음 — 위변조 방지)

PortOne v2 REST:
  GET https://api.portone.io/payments/{paymentId}
  Authorization: PortOne {API_SECRET}
"""
import json
import urllib.request
import urllib.error
import urllib.parse
from app.config import settings
import structlog

logger = structlog.get_logger()

PORTONE_API_BASE = "https://api.portone.io"


def verify_payment(payment_id: str) -> dict:
    """PortOne에서 결제 1건을 조회·검증.

    반환: {"ok": bool, "status": str, "amount": int, "order_id": str|None,
           "raw": dict, "error": str|None}
    - ok=True 이면서 status="PAID" 여야 실제 결제 완료.
    - amount는 결제된 총액(원). 호출측에서 기대 금액과 비교해야 함.
    - order_id는 customData에 우리가 심은 주문 ID(있으면).
    """
    if not settings.PORTONE_API_SECRET:
        return {"ok": False, "status": "", "amount": 0, "order_id": None,
                "raw": {}, "error": "PORTONE_API_SECRET 미설정"}

    url = f"{PORTONE_API_BASE}/payments/{urllib.parse.quote(payment_id, safe='')}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"PortOne {settings.PORTONE_API_SECRET}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        logger.error("portone_verify_http_error", payment_id=payment_id, code=e.code, body=body[:300])
        return {"ok": False, "status": "", "amount": 0, "order_id": None,
                "raw": {}, "error": f"PortOne {e.code}: {body[:200]}"}
    except Exception as e:
        logger.error("portone_verify_failed", payment_id=payment_id, error=str(e))
        return {"ok": False, "status": "", "amount": 0, "order_id": None,
                "raw": {}, "error": str(e)}

    status = data.get("status", "")
    # v2 금액: amount.total
    amount = 0
    try:
        amount = int((data.get("amount") or {}).get("total") or 0)
    except (ValueError, TypeError):
        amount = 0

    # customData는 결제 요청 시 우리가 심은 JSON 문자열(주문 ID 등)
    order_id = None
    custom = data.get("customData")
    if custom:
        try:
            cd = json.loads(custom) if isinstance(custom, str) else custom
            order_id = cd.get("order_id")
        except (ValueError, TypeError):
            order_id = None

    return {"ok": True, "status": status, "amount": amount,
            "order_id": order_id, "raw": data, "error": None}
