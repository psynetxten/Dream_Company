from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.order import Order
from app.models.writer import WriterProfile
from app.models.newspaper import Newspaper
from app.api.v1.auth import get_current_user
from app.models.user import User
from typing import List
import uuid
import structlog

from app.api.v1.auth import get_current_user, require_role
from app.models.user import User
from typing import List
import uuid
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/writer", tags=["writer"])

@router.get("/me")
async def get_writer_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """자신의 작가 프로필 조회"""
    result = await db.execute(select(WriterProfile).where(WriterProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        # 프로필이 없으면 기본 생성 (선택 사항)
        profile = WriterProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        
    return profile

@router.get("/orders")
async def get_assigned_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """배정된 주문 목록 조회"""
    result = await db.execute(select(Order).where(Order.assigned_writer_id == current_user.id))
    return result.scalars().all()

@router.get("/available-orders")
async def get_available_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """배정 대기 중인(human tier) 주문 목록 조회"""
    result = await db.execute(
        select(Order).where(
            and_(
                Order.writer_type == "human",
                Order.assigned_writer_id == None,
                Order.payment_status == "paid"
            )
        )
    )
    return result.scalars().all()

@router.post("/orders/{order_id}/claim")
async def claim_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """특정 주문을 내가 배정받기"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
        
    if order.assigned_writer_id:
        raise HTTPException(status_code=400, detail="이미 다른 작가에게 배정된 주문입니다.")
        
    if order.writer_type != "human":
        raise HTTPException(status_code=400, detail="이 주문은 AI 전용입니다.")

    order.assigned_writer_id = current_user.id
    order.status = "active" # 배정되면 활성화 가능
    
    await db.commit()
    logger.info("order_claimed", order_id=str(order_id), writer_id=str(current_user.id))
    return {"status": "success", "message": "주문이 배정되었습니다."}

@router.put("/newspapers/{newspaper_id}")
async def update_newspaper_draft(
    newspaper_id: uuid.UUID,
    content: dict, # JSON 형태의 신문 내용
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """신문 드래프트 수정"""
    result = await db.execute(select(Newspaper).where(Newspaper.id == newspaper_id))
    newspaper = result.scalar_one_or_none()
    
    if not newspaper:
        raise HTTPException(status_code=404, detail="신문을 찾을 수 없습니다.")
        
    # 주문 소유자 또는 배정된 작가 확인
    order_result = await db.execute(select(Order).where(Order.id == newspaper.order_id))
    order = order_result.scalar_one_or_none()
    
    if order.assigned_writer_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
        
    # 내용 업데이트
    if "headline" in content: newspaper.headline = content["headline"]
    if "subhead" in content: newspaper.subhead = content["subhead"]
    if "lead_paragraph" in content: newspaper.lead_paragraph = content["lead_paragraph"]
    if "body_content" in content: newspaper.body_content = content["body_content"]
    
    await db.commit()
    return {"status": "success", "message": "드래프트가 저장되었습니다."}
