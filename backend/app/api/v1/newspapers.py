from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.newspaper import Newspaper
from app.models.order import Order
from app.schemas.newspaper import NewspaperResponse, NewspaperListItem
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.core.exceptions import raise_not_found, raise_forbidden
import uuid

router = APIRouter(prefix="/newspapers", tags=["newspapers"])


@router.get("", response_model=list[NewspaperListItem])
async def list_my_newspapers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 신문 목록 (발행된 것만)"""
    result = await db.execute(
        select(Newspaper)
        .join(Order, Newspaper.order_id == Order.id)
        .where(
            and_(
                Order.user_id == current_user.id,
                Newspaper.status == "published",
            )
        )
        .order_by(Newspaper.published_at.desc())
    )
    newspapers = result.scalars().all()
    return newspapers


@router.get("/{newspaper_id}", response_model=NewspaperResponse)
async def get_newspaper(
    newspaper_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """신문 상세 열람"""
    result = await db.execute(
        select(Newspaper).where(Newspaper.id == newspaper_id)
    )
    newspaper = result.scalar_one_or_none()

    if not newspaper:
        raise_not_found("신문")

    # 권한 확인
    order_result = await db.execute(
        select(Order).where(Order.id == newspaper.order_id)
    )
    order = order_result.scalar_one_or_none()

    if not order or (order.user_id != current_user.id and current_user.role != "admin"):
        raise_forbidden()

    # 조회수 증가
    newspaper.view_count += 1
    await db.flush()

    return newspaper


@router.get("/orders/{order_id}", response_model=list[NewspaperListItem])
async def list_order_newspapers(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """특정 의뢰의 신문 목록"""
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one_or_none()

    if not order:
        raise_not_found("의뢰")
    if order.user_id != current_user.id and current_user.role != "admin":
        raise_forbidden()

    result = await db.execute(
        select(Newspaper)
        .where(Newspaper.order_id == order_id)
        .order_by(Newspaper.episode_number.asc())
    )
    return result.scalars().all()
