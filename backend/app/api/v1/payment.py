"""
Stripe 결제 API
- POST /payment/checkout-session  : Stripe Checkout 세션 생성 → checkout_url 반환
- POST /payment/webhook           : Stripe 이벤트 수신 → 결제 완료 처리
"""
import uuid
import asyncio
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.order import Order
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.config import settings
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/payment", tags=["payment"])

# 기간별 가격 (KRW — Stripe는 최소 단위가 원화)
PLAN_PRICES: dict[int, int] = {
    7:  9_900,
    14: 19_900,
    30: 39_900,
}


def _sync_create_stripe_session(
    order_id: str,
    duration_days: int,
    amount: int,
    success_url: str,
    cancel_url: str,
) -> tuple[str, str]:
    """Stripe Checkout 세션 생성 (sync → run_in_executor에서 호출)"""
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "krw",
                "product_data": {
                    "name": f"꿈신문사 {duration_days}일 시리즈",
                    "description": "AI 기자단이 매일 오전 8시 꿈 신문을 발행합니다.",
                },
                "unit_amount": amount,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": order_id},
        locale="ko",
    )
    return session.url, session.id


@router.post("/checkout-session")
async def create_checkout_session(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stripe Checkout 세션 생성 — 프론트엔드에서 checkout_url로 리다이렉트"""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="결제 서비스가 설정되지 않았습니다.")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="이미 결제 완료된 주문입니다.")

    amount = PLAN_PRICES.get(order.duration_days, 9_900)
    success_url = f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{settings.FRONTEND_URL}/payment/cancel?order_id={order_id}"

    loop = asyncio.get_event_loop()
    checkout_url, session_id = await loop.run_in_executor(
        None,
        lambda: _sync_create_stripe_session(
            str(order_id), order.duration_days, amount, success_url, cancel_url
        ),
    )

    order.stripe_session_id = session_id
    await db.commit()

    logger.info("stripe_checkout_created", order_id=str(order_id), session_id=session_id)
    return {"checkout_url": checkout_url, "session_id": session_id}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Stripe 웹훅 — 결제 완료 이벤트 처리 (서명 검증 포함)"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # 서명 검증 (STRIPE_WEBHOOK_SECRET 없으면 개발 모드로 통과)
    if settings.STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.errors.SignatureVerificationError:
            logger.warning("stripe_webhook_invalid_signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        import json
        event = json.loads(payload)

    event_type = event.get("type")
    logger.info("stripe_webhook_received", event_type=event_type)

    if event_type == "checkout.session.completed":
        session_obj = event["data"]["object"]
        order_id_str = session_obj.get("metadata", {}).get("order_id")
        payment_intent = session_obj.get("payment_intent", "")

        if not order_id_str:
            return {"status": "ignored"}

        try:
            order_uuid = uuid.UUID(order_id_str)
        except ValueError:
            return {"status": "ignored"}

        result = await db.execute(select(Order).where(Order.id == order_uuid))
        order = result.scalar_one_or_none()

        if order and order.payment_status != "paid":
            order.payment_status = "paid"
            order.stripe_payment_intent_id = payment_intent
            await db.commit()
            logger.info("stripe_payment_confirmed", order_id=order_id_str)

    return {"status": "ok"}


@router.get("/session/{session_id}")
async def get_session_order(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stripe session_id로 연결된 order_id 조회 (결제 성공 페이지에서 사용)"""
    result = await db.execute(
        select(Order).where(Order.stripe_session_id == session_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    return {
        "order_id": str(order.id),
        "payment_status": order.payment_status,
        "status": order.status,
        "duration_days": order.duration_days,
    }
