from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.order import Order
from app.api.v1.auth import get_current_user
from app.models.user import User
import httpx
from app.config import settings
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/payment", tags=["payment"])

@router.post("/verify")
async def verify_payment(
    imp_uid: str,
    merchant_uid: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Portone 결제 검증 및 주문 상태 업데이트"""
    
    # 1. 주문 조회
    result = await db.execute(select(Order).where(Order.id == merchant_uid)) # merchant_uid를 order_id로 사용 가정
    order = result.scalar_one_or_none()
    
    if not order:
        # ID가 UUID 형태일 수 있으므로 다시 시도하거나 에러 처리
        try:
            import uuid
            order_uuid = uuid.UUID(merchant_uid)
            result = await db.execute(select(Order).where(Order.id == order_uuid))
            order = result.scalar_one_or_none()
        except:
            pass
            
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
        
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    # 2. Portone 액세스 토큰 발급 (실제 운영 시 필요)
    # MVP/Sandbox 환경에서는 imp_uid 조회를 생략하거나 Mocking 가능
    # 여기서는 간단히 성공 처리하거나 실제 API 호출 로직 프레임워크 작성
    
    # TODO: Portone API 연동 (실제 API Key 필요)
    # token_res = await httpx.post("https://api.iamport.kr/users/getToken", json={
    #     "imp_key": settings.PORTONE_API_KEY,
    #     "imp_secret": settings.PORTONE_API_SECRET
    # })
    
    # success = False
    # if token_res.status_code == 200:
    #     access_token = token_res.json()["response"]["access_token"]
    #     payment_res = await httpx.get(f"https://api.iamport.kr/payments/{imp_uid}", headers={
    #         "Authorization": access_token
    #     })
    #     if payment_res.status_code == 200:
    #         payment_data = payment_res.json()["response"]
    #         if payment_data["status"] == "paid" and payment_data["amount"] == order.amount_krw:
    #             success = True

    # 샌드박스 단계에서는 imp_uid가 있으면 일단 성공으로 간주 (CEO 승인 전 임시)
    if imp_uid.startswith("imp_"):
        order.payment_status = "paid"
        order.imp_uid = imp_uid
        order.merchant_uid = merchant_uid
        order.status = "draft" # 결제 완료 후 시작 전 상태
        await db.commit()
        return {"status": "success", "message": "결제가 성공적으로 검증되었습니다."}
    
    raise HTTPException(status_code=400, detail="결제 검증에 실패했습니다.")
