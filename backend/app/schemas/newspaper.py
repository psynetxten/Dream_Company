from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
import uuid


class SidebarContent(BaseModel):
    quote: Optional[str] = None
    stats: list = []
    episode_summary: Optional[str] = None


class NewspaperResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    episode_number: int
    future_date: date
    future_date_label: Optional[str]
    headline: Optional[str]
    subhead: Optional[str]
    lead_paragraph: Optional[str]
    body_content: Optional[str]
    sidebar_content: dict
    variables_used: dict
    status: str
    published_at: Optional[datetime]
    view_count: int
    is_saved: bool
    ai_model: Optional[str]
    generation_ms: Optional[int]

    model_config = {"from_attributes": True}


class NewspaperListItem(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    episode_number: int
    future_date: date
    future_date_label: Optional[str]
    headline: Optional[str]
    status: str
    published_at: Optional[datetime]
    view_count: int

    model_config = {"from_attributes": True}
