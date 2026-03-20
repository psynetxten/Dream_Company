from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid
from datetime import datetime


class SponsorCreate(BaseModel):
    company_name: str
    industry: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    target_roles: List[str] = []
    target_companies: List[str] = []
    target_keywords: List[str] = []


class SponsorResponse(BaseModel):
    id: uuid.UUID
    company_name: str
    industry: Optional[str]
    description: Optional[str]
    website_url: Optional[str]
    contact_email: Optional[str]
    target_roles: List[str]
    target_companies: List[str]
    target_keywords: List[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SlotCreate(BaseModel):
    slot_type: str  # company_name | brand_name | banner | sidebar
    variable_value: str  # 기사에 삽입될 실제 텍스트
    purchased_quantity: int = 1


class SlotResponse(BaseModel):
    id: uuid.UUID
    slot_type: str
    variable_value: Optional[str]
    purchased_quantity: int
    remaining_quantity: int
    payment_status: str
    is_auto_matched: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SponsorAnalytics(BaseModel):
    company_name: str
    total_slots: int
    active_slots: int
    total_exposures: int       # 기사에 등장한 총 횟수
    newspapers_featured: int   # 등장한 신문 편수
    remaining_impressions: int # 남은 노출 가능 횟수
