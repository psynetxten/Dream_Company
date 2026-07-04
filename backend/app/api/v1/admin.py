from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.newspaper import Newspaper
from app.models.sponsor import Sponsor
from app.models.schedule import PublicationSchedule
from app.models.partnership_inquiry import PartnershipInquiry
from app.models.infra_cost import InfraCost
from app.api.v1.auth import require_role

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("admin"))],
)


def _today_range():
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1)


def _month_start():
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _token_cost_krw(input_tokens: int, output_tokens: int) -> float:
    # Haiku 4.5: 입력 $1 / 출력 $5 per 1M 토큰, 환율 1,400원 가정
    usd = (input_tokens / 1_000_000) * 1.0 + (output_tokens / 1_000_000) * 5.0
    return round(usd * 1400, 1)


@router.get("/overview")
async def get_overview(db: AsyncSession = Depends(get_db)):
    """오늘의 현황 — 유저/신문/주문 수 + 오늘 발행 성공/실패."""
    today_start, today_end = _today_range()

    user_count = await db.scalar(select(func.count()).select_from(User))
    users_today = await db.scalar(
        select(func.count()).select_from(User).where(User.created_at >= today_start)
    )
    order_count = await db.scalar(select(func.count()).select_from(Order))
    orders_today = await db.scalar(
        select(func.count()).select_from(Order).where(Order.created_at >= today_start)
    )
    newspaper_count = await db.scalar(select(func.count()).select_from(Newspaper))

    published_today = await db.scalar(
        select(func.count()).select_from(PublicationSchedule).where(
            PublicationSchedule.status == "completed",
            PublicationSchedule.executed_at >= today_start,
            PublicationSchedule.executed_at < today_end,
        )
    )
    failed_today = await db.scalar(
        select(func.count()).select_from(PublicationSchedule).where(
            PublicationSchedule.status == "failed",
            PublicationSchedule.executed_at >= today_start,
            PublicationSchedule.executed_at < today_end,
        )
    )
    pending_today = await db.scalar(
        select(func.count()).select_from(PublicationSchedule).where(
            PublicationSchedule.status == "pending",
            PublicationSchedule.scheduled_at >= today_start,
            PublicationSchedule.scheduled_at < today_end,
        )
    )
    new_inquiries = await db.scalar(
        select(func.count()).select_from(PartnershipInquiry).where(
            PartnershipInquiry.status == "new"
        )
    )
    sponsor_count = await db.scalar(select(func.count()).select_from(Sponsor))

    return {
        "user_count": user_count or 0,
        "users_today": users_today or 0,
        "order_count": order_count or 0,
        "orders_today": orders_today or 0,
        "newspaper_count": newspaper_count or 0,
        "published_today": published_today or 0,
        "failed_today": failed_today or 0,
        "pending_today": pending_today or 0,
        "new_inquiries": new_inquiries or 0,
        "sponsor_count": sponsor_count or 0,
    }


@router.get("/inquiries")
async def list_inquiries(status: str | None = None, db: AsyncSession = Depends(get_db)):
    """스폰서 제휴 문의 목록 (최신순)"""
    q = select(PartnershipInquiry).order_by(PartnershipInquiry.created_at.desc())
    if status:
        q = q.where(PartnershipInquiry.status == status)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "company_name": r.company_name,
            "contact_name": r.contact_name,
            "email": r.email,
            "phone": r.phone,
            "message": r.message,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


class InquiryStatusUpdate(BaseModel):
    status: str  # new | contacted | closed


@router.patch("/inquiries/{inquiry_id}")
async def update_inquiry_status(
    inquiry_id: str, data: InquiryStatusUpdate, db: AsyncSession = Depends(get_db)
):
    if data.status not in ("new", "contacted", "closed"):
        raise HTTPException(status_code=400, detail="잘못된 상태 값입니다.")
    result = await db.execute(select(PartnershipInquiry).where(PartnershipInquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="문의를 찾을 수 없습니다.")
    inquiry.status = data.status
    await db.flush()
    return {"success": True}


@router.get("/schedule-health")
async def schedule_health(db: AsyncSession = Depends(get_db)):
    """발행 스케줄 상태 + 최근 실패 + 토큰비용(오늘/이번주)."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    today_start, _ = _today_range()

    upcoming = await db.scalar(
        select(func.count()).select_from(PublicationSchedule).where(
            PublicationSchedule.status == "pending", PublicationSchedule.scheduled_at >= now
        )
    )
    overdue = await db.scalar(
        select(func.count()).select_from(PublicationSchedule).where(
            PublicationSchedule.status == "pending", PublicationSchedule.scheduled_at < now
        )
    )

    recent_failures_result = await db.execute(
        select(PublicationSchedule)
        .where(PublicationSchedule.status == "failed")
        .order_by(PublicationSchedule.executed_at.desc())
        .limit(10)
    )
    recent_failures = [
        {
            "id": str(f.id),
            "order_id": str(f.order_id),
            "episode_number": f.episode_number,
            "error_message": f.error_message,
            "executed_at": f.executed_at.isoformat() if f.executed_at else None,
            "retry_count": f.retry_count,
        }
        for f in recent_failures_result.scalars().all()
    ]

    tokens_today = await db.execute(
        select(
            func.coalesce(func.sum(Newspaper.input_tokens), 0),
            func.coalesce(func.sum(Newspaper.output_tokens), 0),
            func.count(),
        ).where(Newspaper.created_at >= today_start)
    )
    in_today, out_today, count_today = tokens_today.one()

    tokens_week = await db.execute(
        select(
            func.coalesce(func.sum(Newspaper.input_tokens), 0),
            func.coalesce(func.sum(Newspaper.output_tokens), 0),
            func.count(),
        ).where(Newspaper.created_at >= week_ago)
    )
    in_week, out_week, count_week = tokens_week.one()

    return {
        "upcoming_pending": upcoming or 0,
        "overdue_pending": overdue or 0,
        "recent_failures": recent_failures,
        "tokens_today": {"input": in_today, "output": out_today, "papers": count_today, "cost_krw": _token_cost_krw(in_today, out_today)},
        "tokens_week": {"input": in_week, "output": out_week, "papers": count_week, "cost_krw": _token_cost_krw(in_week, out_week)},
    }


@router.get("/finance")
async def get_finance(db: AsyncSession = Depends(get_db)):
    """매출·비용·순이익 — 결제 미연동 상태에서는 매출이 0으로 나오는 게 정상(대기 상태)."""
    today_start, _ = _today_range()
    month_start = _month_start()
    now = datetime.now(timezone.utc)

    async def revenue_since(since: datetime) -> int:
        total = await db.scalar(
            select(func.coalesce(func.sum(Order.amount_krw), 0)).where(
                Order.payment_status == "paid", Order.created_at >= since
            )
        )
        return total or 0

    revenue_today = await revenue_since(today_start)
    revenue_month = await revenue_since(month_start)
    revenue_all = await db.scalar(
        select(func.coalesce(func.sum(Order.amount_krw), 0)).where(Order.payment_status == "paid")
    )
    paid_order_count = await db.scalar(
        select(func.count()).where(Order.payment_status == "paid")
    )

    tokens_month = await db.execute(
        select(
            func.coalesce(func.sum(Newspaper.input_tokens), 0),
            func.coalesce(func.sum(Newspaper.output_tokens), 0),
        ).where(Newspaper.created_at >= month_start)
    )
    in_month, out_month = tokens_month.one()
    token_cost_month = _token_cost_krw(in_month, out_month)

    infra_result = await db.execute(select(InfraCost))
    infra_rows = infra_result.scalars().all()
    infra_cost_month = sum(r.monthly_cost_krw for r in infra_rows)

    total_cost_month = token_cost_month + infra_cost_month

    return {
        "revenue": {
            "today": revenue_today,
            "this_month": revenue_month,
            "all_time": revenue_all or 0,
            "paid_orders": paid_order_count or 0,
        },
        "cost_this_month": {
            "token_cost_krw": token_cost_month,
            "infra_cost_krw": infra_cost_month,
            "total_krw": total_cost_month,
        },
        "net_profit_this_month": round(revenue_month - total_cost_month, 1),
        "note": "결제 미연동 상태에서는 매출이 0으로 표시됩니다(정상). Portone/Stripe 연동 후 자동 반영됩니다.",
    }


@router.get("/infra-costs")
async def list_infra_costs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InfraCost).order_by(InfraCost.service))
    rows = result.scalars().all()
    return [
        {
            "service": r.service,
            "monthly_cost_krw": r.monthly_cost_krw,
            "note": r.note,
            "updated_at": r.updated_at.isoformat(),
        }
        for r in rows
    ]


class InfraCostUpdate(BaseModel):
    monthly_cost_krw: int
    note: str | None = None


@router.patch("/infra-costs/{service}")
async def update_infra_cost(service: str, data: InfraCostUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InfraCost).where(InfraCost.service == service))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="등록되지 않은 서비스입니다.")
    row.monthly_cost_krw = data.monthly_cost_krw
    if data.note is not None:
        row.note = data.note
    await db.flush()
    return {"success": True}


@router.get("/users")
async def search_users(q: str = "", db: AsyncSession = Depends(get_db)):
    """유저 검색(CS용) — 이메일/이름"""
    query = select(User).order_by(User.created_at.desc()).limit(50)
    if q:
        like = f"%{q}%"
        query = query.where(or_(User.email.ilike(like), User.full_name.ilike(like)))
    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "roles": u.roles,
            "credits": u.credits,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/orders")
async def search_orders(q: str = "", db: AsyncSession = Depends(get_db)):
    """주문 검색(CS용) — 주인공명/유저 이메일"""
    query = (
        select(Order, User.email)
        .join(User, Order.user_id == User.id)
        .order_by(Order.created_at.desc())
        .limit(50)
    )
    if q:
        like = f"%{q}%"
        query = query.where(or_(Order.protagonist_name.ilike(like), User.email.ilike(like)))
    result = await db.execute(query)
    rows = result.all()

    orders = []
    for order, email in rows:
        total = await db.scalar(
            select(func.count()).where(Newspaper.order_id == order.id)
        )
        orders.append({
            "id": str(order.id),
            "user_email": email,
            "protagonist_name": order.protagonist_name,
            "target_role": order.target_role,
            "duration_days": order.duration_days,
            "payment_type": order.payment_type,
            "payment_status": order.payment_status,
            "status": order.status,
            "newspaper_count": total or 0,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        })
    return orders
