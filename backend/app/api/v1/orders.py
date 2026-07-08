from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.order import Order
from app.models.newspaper import Newspaper
from app.models.schedule import PublicationSchedule
from app.models.user import User
from app.models.credit_transaction import CreditTransaction
from app.schemas.order import OrderCreate, OrderResponse, OrderStartResponse
from app.api.v1.auth import get_current_user
from app.core.exceptions import raise_not_found, raise_forbidden
import uuid

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """꿈 의뢰 생성"""
    # duration_days 검증 (3일=무료 체험, 7/14/30=유료 시리즈)
    if data.duration_days not in [3, 7, 14, 30]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="기간은 3일, 7일, 14일, 30일 중 선택해야 합니다.")

    # 무료 플랜은 3일 체험만 허용
    if data.payment_type == "free" and data.duration_days != 3:
        raise HTTPException(status_code=400, detail="무료 플랜은 3일 체험 시리즈만 이용 가능합니다.")

    # 유료(크레딧) 플랜은 3일 불가 — 7일 이상
    if data.payment_type != "free" and data.duration_days == 3:
        raise HTTPException(status_code=400, detail="3일 체험은 무료 플랜에서만 이용 가능합니다.")

    # 크레딧 플랜: 잔액 미리 확인
    if data.payment_type == "credits":
        result = await db.execute(select(User).where(User.id == current_user.id))
        user = result.scalar_one_or_none()
        if not user or user.credits < data.duration_days:
            available = user.credits if user else 0
            raise HTTPException(
                status_code=402,
                detail=f"크레딧이 부족합니다. 필요: {data.duration_days}개, 보유: {available}개"
            )

    payment_status = "free" if data.payment_type == "free" else (
        "paid" if data.payment_type == "credits" else "pending"
    )

    order = Order(
        user_id=current_user.id,
        dream_description=data.dream_description,
        protagonist_name=data.protagonist_name,
        target_role=data.target_role,
        target_company=data.target_company,
        supporting_people=[p.model_dump() for p in data.supporting_people],
        duration_days=data.duration_days,
        series_theme=data.series_theme,
        future_year=data.future_year,
        payment_type=data.payment_type,
        payment_status=payment_status,
        writer_type="ai",
        status="draft",
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)

    return _order_to_response(order, 0, 0)


@router.post("/{order_id}/start", response_model=OrderStartResponse)
async def start_order(
    order_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """의뢰 시작 (발행 스케줄 생성 + 오케스트레이터 실행)"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise_not_found("의뢰")
    if order.user_id != current_user.id:
        raise_forbidden()
    if order.status not in ["draft"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"이미 {order.status} 상태인 의뢰입니다.")

    # 결제 상태 확인 (무료/크레딧 주문은 바로 시작)
    if order.payment_type not in ("free", "credits") and order.payment_status != "paid":
        raise HTTPException(status_code=402, detail="결제가 완료되지 않았습니다.")

    # 크레딧 차감
    if order.payment_type == "credits":
        user_result = await db.execute(select(User).where(User.id == current_user.id))
        user = user_result.scalar_one_or_none()
        if not user or user.credits < order.duration_days:
            available = user.credits if user else 0
            raise HTTPException(
                status_code=402,
                detail=f"크레딧이 부족합니다. 필요: {order.duration_days}개, 보유: {available}개"
            )
        credits_before = user.credits
        user.credits -= order.duration_days
        tx = CreditTransaction(
            user_id=user.id,
            type="consume",
            amount=-order.duration_days,
            credits_before=credits_before,
            credits_after=user.credits,
            description=f"{order.protagonist_name}의 꿈 {order.duration_days}편",
            order_id=order.id,
        )
        db.add(tx)

    # 상태 업데이트
    order.status = "active"
    order.starts_at = datetime.now(timezone.utc)
    await db.flush()

    # 백그라운드: 오케스트레이터 실행 + 발행 스케줄 DB 저장
    background_tasks.add_task(_process_order_background, str(order.id))

    return OrderStartResponse(
        order_id=order.id,
        status="active",
        schedule_count=order.duration_days,
        sponsors=[],
        message=f"{order.duration_days}일 시리즈가 시작됐습니다! 매일 오전 8시에 꿈신문이 발행됩니다.",
    )


async def _process_order_background(order_id: str):
    """백그라운드: 오케스트레이터 실행 + 스케줄 DB 저장"""
    from app.database import get_db_session
    from app.agents.editor_in_chief.agent import EditorInChief

    async with get_db_session() as db:
        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            return

        # 꿈 동료 공간용 비식별 열망 한 줄 생성(이름·사적정보 제거). 실패해도 발행엔 무관.
        if not order.public_aspiration:
            try:
                from app.services.dream_companions import generate_public_aspiration
                order.public_aspiration = await generate_public_aspiration(
                    target_role=order.target_role,
                    dream_description=order.dream_description,
                    future_year=order.future_year,
                    protagonist_name=order.protagonist_name,
                )
                await db.flush()
            except Exception:
                pass

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
            "payment_type": order.payment_type,
        }

        orchestrator = EditorInChief()

        result_data = await orchestrator.process_new_order(order_dict)

        # 스케줄 DB 저장
        for item in result_data["schedule"]:
            from datetime import datetime
            scheduled_at = datetime.fromisoformat(item["scheduled_at"])
            schedule = PublicationSchedule(
                order_id=order.id,
                episode_number=item["episode"],
                scheduled_at=scheduled_at,
                status="pending",
            )
            db.add(schedule)

        await db.flush()

        # 첫 번째 에피소드 즉시 생성 (무료/크레딧/유료 모두 — 시작 직후 바로 1화 제공)
        # 이 함수는 정당한 시작(무료/크레딧 start 또는 결제 검증 완료) 후에만 호출됨.
        if True:
            from app.tasks.daily_publish import process_single_schedule
            import asyncio as _asyncio

            first_result = await db.execute(
                select(PublicationSchedule)
                .where(PublicationSchedule.order_id == order.id)
                .order_by(PublicationSchedule.episode_number)
                .limit(1)
            )
            first_schedule = first_result.scalar_one_or_none()
            if first_schedule and first_schedule.status == "pending":
                sem = _asyncio.Semaphore(1)
                await process_single_schedule(db, first_schedule, orchestrator, sem)


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 의뢰 목록"""
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    responses = []
    for order in orders:
        # 신문 수 집계
        total_result = await db.execute(
            select(func.count()).where(Newspaper.order_id == order.id)
        )
        total = total_result.scalar() or 0

        pub_result = await db.execute(
            select(func.count()).where(
                and_(Newspaper.order_id == order.id, Newspaper.status == "published")
            )
        )
        published = pub_result.scalar() or 0

        responses.append(_order_to_response(order, total, published))

    return responses


@router.get("/dream-stats")
async def get_dream_stats(
    role: str = "",
    db: AsyncSession = Depends(get_db),
):
    """같은 꿈(target_role)을 가진 의뢰 수 반환 — 인증 불필요"""
    if not role:
        return {"count": 0}
    result = await db.execute(
        select(func.count(Order.id)).where(
            Order.target_role.ilike(f"%{role}%")
        )
    )
    count = result.scalar() or 0
    return {"count": count}


@router.get("/dream-companions")
async def get_dream_companions(role: str = "", db: AsyncSession = Depends(get_db)):
    """같은 미래를 향한 사람들 — 비식별 열망 목록 + 인원. 인증 불필요.

    개인정보 보호: 이름·원본 꿈 설명은 절대 반환하지 않는다. 저장된 비식별
    열망 한 줄(public_aspiration)과 미래연도만 노출. 실데이터가 적으면 시드로 채운다.
    """
    from app.services.dream_companions import SEED_ASPIRATIONS

    # 같은 분야(target_role) 인원 수
    if role:
        count = await db.scalar(
            select(func.count(Order.id)).where(Order.target_role.ilike(f"%{role}%"))
        ) or 0
    else:
        count = await db.scalar(select(func.count(Order.id))) or 0

    # 실주문의 비식별 열망(최신순). 같은 분야 우선, 부족하면 전체에서 보충.
    real: list[dict] = []
    seen: set[str] = set()

    async def _collect(q):
        res = await db.execute(q)
        for asp, year in res.all():
            if asp and asp not in seen:
                seen.add(asp)
                real.append({"line": asp, "year": year})

    if role:
        await _collect(
            select(Order.public_aspiration, Order.future_year)
            .where(Order.target_role.ilike(f"%{role}%"), Order.public_aspiration.isnot(None))
            .order_by(Order.created_at.desc())
            .limit(5)
        )
    if len(real) < 5:
        await _collect(
            select(Order.public_aspiration, Order.future_year)
            .where(Order.public_aspiration.isnot(None))
            .order_by(Order.created_at.desc())
            .limit(5)
        )

    # 시드로 5개까지 채움(실데이터 우선)
    aspirations = real[:5]
    for seed in SEED_ASPIRATIONS:
        if len(aspirations) >= 5:
            break
        if seed["line"] not in seen:
            seen.add(seed["line"])
            aspirations.append(seed)

    # 이번 주 신규(같은 분야)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_q = select(func.count(Order.id)).where(Order.created_at >= week_ago)
    if role:
        new_q = new_q.where(Order.target_role.ilike(f"%{role}%"))
    new_this_week = await db.scalar(new_q) or 0

    return {
        "count": count,
        "aspirations": aspirations,
        "new_this_week": new_this_week,
    }


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """의뢰 상세"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise_not_found("의뢰")
    # 의뢰 소유자 or 배정된 작가 or 어드민만 접근 허용
    is_owner = order.user_id == current_user.id
    is_assigned_writer = order.assigned_writer_id == current_user.id
    is_admin = current_user.role == "admin"
    if not (is_owner or is_assigned_writer or is_admin):
        raise_forbidden()

    total_result = await db.execute(
        select(func.count()).where(Newspaper.order_id == order.id)
    )
    total = total_result.scalar() or 0

    pub_result = await db.execute(
        select(func.count()).where(
            and_(Newspaper.order_id == order.id, Newspaper.status == "published")
        )
    )
    published = pub_result.scalar() or 0

    return _order_to_response(order, total, published)


def _order_to_response(order: Order, total: int, published: int) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        dream_description=order.dream_description,
        protagonist_name=order.protagonist_name,
        target_role=order.target_role,
        target_company=order.target_company,
        duration_days=order.duration_days,
        future_year=order.future_year,
        payment_type=order.payment_type,
        payment_status=order.payment_status,
        writer_type=order.writer_type,
        status=order.status,
        created_at=order.created_at,
        starts_at=order.starts_at,
        ends_at=order.ends_at,
        total_newspapers=total,
        published_newspapers=published,
    )
