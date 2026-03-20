from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timezone
from app.database import get_db
from app.models.order import Order
from app.models.newspaper import Newspaper
from app.models.schedule import PublicationSchedule
from app.schemas.order import OrderCreate, OrderResponse, OrderStartResponse
from app.api.v1.auth import get_current_user
from app.models.user import User
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
    # duration_days 검증
    if data.duration_days not in [7, 14, 30]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="기간은 7일, 14일, 30일 중 선택해야 합니다.")

    # 무료 플랜은 7일만 허용
    if data.payment_type == "free" and data.duration_days != 7:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="무료 플랜은 7일 시리즈만 이용 가능합니다.")

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
        payment_status="free" if data.payment_type == "free" else "pending",
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

    # 결제 상태 확인 (무료 주문은 바로 시작)
    if order.payment_type != "free" and order.payment_status != "paid":
        from fastapi import HTTPException
        raise HTTPException(status_code=402, detail="결제가 완료되지 않았습니다.")

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
