from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.partnership_inquiry import PartnershipInquiry as PartnershipInquiryModel
from app.services.email_service import send_partnership_inquiry_ack, send_partnership_inquiry_notify
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/partnership", tags=["partnership"])


class PartnershipInquiryCreate(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: str = ""
    message: str = ""


@router.post("/inquiry")
async def create_partnership_inquiry(
    data: PartnershipInquiryCreate,
    db: AsyncSession = Depends(get_db),
):
    """스폰서 제휴 문의 — 인증 불필요. DB 저장 + 운영진 알림 + 문의자 접수확인 메일 발송."""
    inquiry = PartnershipInquiryModel(
        company_name=data.company_name,
        contact_name=data.contact_name,
        email=data.email,
        phone=data.phone or None,
        message=data.message or None,
    )
    db.add(inquiry)
    await db.flush()

    logger.info(
        "partnership_inquiry_received",
        inquiry_id=str(inquiry.id),
        company=data.company_name,
        contact=data.contact_name,
    )
    send_partnership_inquiry_notify(
        company_name=data.company_name,
        contact_name=data.contact_name,
        contact_email=data.email,
        phone=data.phone,
        message=data.message,
    )
    send_partnership_inquiry_ack(email=data.email, contact_name=data.contact_name)
    return {"success": True, "message": "문의가 접수되었습니다. 곧 연락드리겠습니다."}
