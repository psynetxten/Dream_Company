from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from app.services.email_service import send_partnership_inquiry_ack, send_partnership_inquiry_notify
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/partnership", tags=["partnership"])


class PartnershipInquiry(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: str = ""
    message: str = ""


@router.post("/inquiry")
async def create_partnership_inquiry(data: PartnershipInquiry):
    """스폰서 제휴 문의 — 인증 불필요. 운영진 알림 + 문의자 접수확인 메일 발송."""
    logger.info(
        "partnership_inquiry_received",
        company=data.company_name,
        contact=data.contact_name,
        email=data.email,
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
