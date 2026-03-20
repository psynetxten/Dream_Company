from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
import uuid


class SupportingPerson(BaseModel):
    name: str
    relation: str
    company: Optional[str] = None


class OrderCreate(BaseModel):
    dream_description: str = Field(..., min_length=10, max_length=2000)
    protagonist_name: str = Field(..., min_length=1, max_length=100)
    target_role: str = Field(..., min_length=1, max_length=200)
    target_company: Optional[str] = Field(None, max_length=200)
    supporting_people: List[SupportingPerson] = []
    duration_days: int = Field(..., ge=7)  # 7 | 14 | 30
    series_theme: Optional[str] = Field(None, max_length=200)
    future_year: int = Field(2030, ge=2025, le=2100)
    payment_type: str = Field(..., pattern="^(subscription|one_time|free)$")


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    dream_description: str
    protagonist_name: str
    target_role: str
    target_company: Optional[str]
    duration_days: int
    future_year: int
    payment_type: str
    payment_status: str
    merchant_uid: Optional[str] = None
    imp_uid: Optional[str] = None
    payment_method: Optional[str] = None
    writer_type: str
    status: str
    created_at: datetime
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    total_newspapers: int = 0
    published_newspapers: int = 0

    model_config = {"from_attributes": True}


class OrderStartResponse(BaseModel):
    order_id: uuid.UUID
    status: str
    schedule_count: int
    sponsors: list
    message: str
