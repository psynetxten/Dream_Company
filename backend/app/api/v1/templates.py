"""
템플릿 마켓플레이스 API

작가: 템플릿 생성/수정/에피소드 집필
독자: 마켓 탐색/구매/슬롯 입력
엔진: 슬롯 치환 → 개인화 신문 생성
"""
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.template import TemplateSeries, TemplateSlot, TemplateEpisode, TemplatePurchase
from app.models.order import Order
from app.models.newspaper import Newspaper
from app.models.user import User
from app.api.v1.auth import get_current_user, require_role
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/templates", tags=["templates"])


# ─── Pydantic 스키마 ────────────────────────────────────────────────────────

class SlotDefinition(BaseModel):
    slot_key: str = Field(..., description="슬롯 키 (예: 주인공, 직업)")
    slot_label: str = Field(..., description="독자에게 보여줄 라벨")
    slot_hint: Optional[str] = None
    slot_category: str = "identity"
    is_required: bool = True
    default_value: Optional[str] = None
    display_order: int = 0


class EpisodeContent(BaseModel):
    episode_number: int
    day_offset: int = 0
    headline_template: str = ""
    subhead_template: str = ""
    lead_paragraph_template: str = ""
    body_content_template: str = ""
    sidebar_template: dict = {}


class TemplateCreate(BaseModel):
    title: str
    description: str
    genre: str
    theme: Optional[str] = None
    duration_days: int = Field(..., description="7 | 14 | 30")
    price_krw: int = 9900
    future_year: int = 2030
    preview_headline: Optional[str] = None
    preview_lead: Optional[str] = None
    slots: list[SlotDefinition] = []
    episodes: list[EpisodeContent] = []


class SlotValues(BaseModel):
    slot_values: dict[str, str] = Field(
        ..., description="{주인공: '김철수', 직업: 'AI 엔지니어', ...}"
    )


# ─── 유틸: 슬롯 치환 엔진 ───────────────────────────────────────────────────

def apply_slots(text: str, slot_values: dict) -> str:
    """[슬롯키] → 실제값 치환"""
    for key, value in slot_values.items():
        text = text.replace(f"[{key}]", value)
    return text


def validate_slots(template: TemplateSeries, slot_values: dict) -> list[str]:
    """필수 슬롯 누락 여부 확인. 누락된 슬롯 키 목록 반환"""
    missing = []
    for slot in template.slots:
        if slot.is_required and slot.slot_key not in slot_values:
            missing.append(slot.slot_key)
    return missing


# ─── 작가 API ──────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """작가: 새 템플릿 시리즈 생성"""
    if data.duration_days not in [7, 14, 30]:
        raise HTTPException(400, "duration_days는 7, 14, 30 중 하나여야 합니다.")

    template = TemplateSeries(
        writer_id=current_user.id,
        title=data.title,
        description=data.description,
        genre=data.genre,
        theme=data.theme,
        duration_days=data.duration_days,
        price_krw=data.price_krw,
        future_year=data.future_year,
        preview_headline=data.preview_headline,
        preview_lead=data.preview_lead,
        status="draft",
    )
    db.add(template)
    await db.flush()

    # 슬롯 생성
    for s in data.slots:
        db.add(TemplateSlot(
            template_id=template.id,
            slot_key=s.slot_key,
            slot_label=s.slot_label,
            slot_hint=s.slot_hint,
            slot_category=s.slot_category,
            is_required=s.is_required,
            default_value=s.default_value,
            display_order=s.display_order,
        ))

    # 에피소드 생성
    for ep in data.episodes:
        db.add(TemplateEpisode(
            template_id=template.id,
            episode_number=ep.episode_number,
            day_offset=ep.day_offset,
            headline_template=ep.headline_template,
            subhead_template=ep.subhead_template,
            lead_paragraph_template=ep.lead_paragraph_template,
            body_content_template=ep.body_content_template,
            sidebar_template=ep.sidebar_template,
        ))

    await db.commit()
    await db.refresh(template)
    logger.info("template_created", template_id=str(template.id), writer=current_user.email)
    return {"id": str(template.id), "status": "draft", "title": template.title}


@router.put("/{template_id}/publish")
async def publish_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """작가: 템플릿을 마켓에 등록"""
    result = await db.execute(select(TemplateSeries).where(TemplateSeries.id == template_id))
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(404, "템플릿을 찾을 수 없습니다.")
    if template.writer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "권한이 없습니다.")
    if not template.episodes:
        raise HTTPException(400, "에피소드가 없으면 마켓 등록이 불가합니다.")

    template.status = "listed"
    await db.commit()
    return {"status": "listed"}


@router.get("/my", summary="작가: 내 템플릿 목록")
async def get_my_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    result = await db.execute(
        select(TemplateSeries).where(TemplateSeries.writer_id == current_user.id)
        .order_by(TemplateSeries.created_at.desc())
    )
    templates = result.scalars().all()
    return [
        {
            "id": str(t.id), "title": t.title, "genre": t.genre,
            "duration_days": t.duration_days, "price_krw": t.price_krw,
            "status": t.status, "purchase_count": t.purchase_count,
            "total_revenue_krw": t.total_revenue_krw,
        }
        for t in templates
    ]


@router.get("/{template_id}/detail", summary="작가: 템플릿 상세 (에피소드+슬롯 포함)")
async def get_template_detail(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    result = await db.execute(
        select(TemplateSeries).where(TemplateSeries.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(404, "템플릿을 찾을 수 없습니다.")
    if template.writer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "권한이 없습니다.")

    return {
        "id": str(template.id),
        "title": template.title,
        "description": template.description,
        "genre": template.genre,
        "theme": template.theme,
        "duration_days": template.duration_days,
        "price_krw": template.price_krw,
        "future_year": template.future_year,
        "status": template.status,
        "preview_headline": template.preview_headline,
        "preview_lead": template.preview_lead,
        "slots": [
            {
                "id": str(s.id), "slot_key": s.slot_key, "slot_label": s.slot_label,
                "slot_hint": s.slot_hint, "slot_category": s.slot_category,
                "is_required": s.is_required, "default_value": s.default_value,
                "display_order": s.display_order,
            }
            for s in template.slots
        ],
        "episodes": [
            {
                "id": str(ep.id), "episode_number": ep.episode_number,
                "day_offset": ep.day_offset,
                "headline_template": ep.headline_template,
                "subhead_template": ep.subhead_template,
                "lead_paragraph_template": ep.lead_paragraph_template,
                "body_content_template": ep.body_content_template,
            }
            for ep in template.episodes
        ],
    }


@router.put("/{template_id}/episodes/{episode_id}")
async def update_episode(
    template_id: uuid.UUID,
    episode_id: uuid.UUID,
    data: EpisodeContent,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("writer", "admin")),
):
    """작가: 에피소드 내용 수정"""
    t_result = await db.execute(select(TemplateSeries).where(TemplateSeries.id == template_id))
    template = t_result.scalar_one_or_none()
    if not template or (template.writer_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(403, "권한이 없습니다.")

    ep_result = await db.execute(
        select(TemplateEpisode).where(
            TemplateEpisode.id == episode_id,
            TemplateEpisode.template_id == template_id
        )
    )
    ep = ep_result.scalar_one_or_none()
    if not ep:
        raise HTTPException(404, "에피소드를 찾을 수 없습니다.")

    ep.headline_template = data.headline_template
    ep.subhead_template = data.subhead_template
    ep.lead_paragraph_template = data.lead_paragraph_template
    ep.body_content_template = data.body_content_template
    ep.sidebar_template = data.sidebar_template
    await db.commit()
    return {"status": "saved"}


# ─── 독자 API ──────────────────────────────────────────────────────────────

@router.get("/market", summary="독자: 마켓플레이스 — 등록된 템플릿 목록")
async def list_market_templates(
    genre: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """인증 없이도 탐색 가능"""
    query = select(TemplateSeries).where(TemplateSeries.status == "listed")
    if genre:
        query = query.where(TemplateSeries.genre == genre)
    query = query.order_by(TemplateSeries.purchase_count.desc())

    result = await db.execute(query)
    templates = result.scalars().all()
    return [
        {
            "id": str(t.id), "title": t.title, "description": t.description,
            "genre": t.genre, "theme": t.theme,
            "duration_days": t.duration_days, "price_krw": t.price_krw,
            "future_year": t.future_year,
            "preview_headline": t.preview_headline,
            "preview_lead": t.preview_lead,
            "purchase_count": t.purchase_count,
            "slot_count": len(t.slots),
        }
        for t in templates
    ]


@router.get("/market/{template_id}", summary="독자: 템플릿 미리보기 + 슬롯 목록")
async def get_market_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TemplateSeries).where(
            TemplateSeries.id == template_id,
            TemplateSeries.status == "listed"
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(404, "템플릿을 찾을 수 없습니다.")

    return {
        "id": str(template.id),
        "title": template.title,
        "description": template.description,
        "genre": template.genre,
        "duration_days": template.duration_days,
        "price_krw": template.price_krw,
        "future_year": template.future_year,
        "preview_headline": template.preview_headline,
        "preview_lead": template.preview_lead,
        "purchase_count": template.purchase_count,
        "slots": [
            {
                "slot_key": s.slot_key, "slot_label": s.slot_label,
                "slot_hint": s.slot_hint, "slot_category": s.slot_category,
                "is_required": s.is_required, "default_value": s.default_value,
                "display_order": s.display_order,
            }
            for s in sorted(template.slots, key=lambda s: s.display_order)
        ],
    }


@router.post("/market/{template_id}/purchase", status_code=status.HTTP_201_CREATED)
async def purchase_template(
    template_id: uuid.UUID,
    data: SlotValues,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    독자: 템플릿 구매 + 슬롯 입력 → 개인화 신문 시리즈 즉시 생성

    슬롯 치환 후 Order + Newspaper 레코드 자동 생성.
    (결제 연동 전: payment_status='free' 로 테스트 가능)
    """
    # 템플릿 조회
    t_result = await db.execute(
        select(TemplateSeries).where(
            TemplateSeries.id == template_id,
            TemplateSeries.status == "listed"
        )
    )
    template = t_result.scalar_one_or_none()
    if not template:
        raise HTTPException(404, "템플릿을 찾을 수 없습니다.")

    # 필수 슬롯 검증
    missing = validate_slots(template, data.slot_values)
    if missing:
        raise HTTPException(400, f"필수 슬롯 누락: {', '.join(missing)}")

    # 슬롯 기본값 채우기
    full_slots = {s.slot_key: s.default_value or "" for s in template.slots}
    full_slots.update(data.slot_values)

    protagonist = full_slots.get("주인공", current_user.email.split("@")[0])

    # Order 생성
    order = Order(
        user_id=current_user.id,
        protagonist_name=protagonist,
        dream_description=apply_slots(template.description, full_slots),
        target_role=full_slots.get("직업", ""),
        target_company=full_slots.get("회사", None),
        duration_days=template.duration_days,
        future_year=template.future_year,
        payment_type="template",
        payment_status="paid",   # 결제 연동 전 테스트용
        writer_type="template",
        status="active",
    )
    db.add(order)
    await db.flush()

    # 에피소드별 슬롯 치환 → Newspaper 생성
    base_date = datetime.now(timezone.utc).date()
    for ep in template.episodes:
        publish_date = base_date + timedelta(days=ep.day_offset)
        db.add(Newspaper(
            order_id=order.id,
            episode_number=ep.episode_number,
            future_date=publish_date,
            headline=apply_slots(ep.headline_template, full_slots),
            subhead=apply_slots(ep.subhead_template, full_slots),
            lead_paragraph=apply_slots(ep.lead_paragraph_template, full_slots),
            body_content=apply_slots(ep.body_content_template, full_slots),
            sidebar_content=ep.sidebar_template,
            status="published",
            published_at=datetime.now(timezone.utc),
            variables_used=full_slots,
            ai_model="template",
        ))

    # 구매 기록
    purchase = TemplatePurchase(
        template_id=template.id,
        buyer_id=current_user.id,
        order_id=order.id,
        slot_values=full_slots,
        payment_status="paid",
        amount_krw=template.price_krw,
    )
    db.add(purchase)

    # 통계 업데이트
    template.purchase_count += 1
    template.total_revenue_krw += template.price_krw

    await db.commit()
    logger.info("template_purchased",
                template_id=str(template_id),
                buyer=current_user.email,
                order_id=str(order.id))

    return {
        "order_id": str(order.id),
        "protagonist": protagonist,
        "newspaper_count": len(template.episodes),
        "message": f"'{template.title}' 시리즈가 {protagonist}님의 이름으로 개인화되었습니다!"
    }


@router.get("/my-purchases", summary="독자: 내가 구매한 템플릿 목록")
async def my_purchases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TemplatePurchase).where(TemplatePurchase.buyer_id == current_user.id)
        .order_by(TemplatePurchase.purchased_at.desc())
    )
    purchases = result.scalars().all()
    return [
        {
            "purchase_id": str(p.id),
            "template_id": str(p.template_id),
            "order_id": str(p.order_id),
            "slot_values": p.slot_values,
            "purchased_at": p.purchased_at.isoformat(),
        }
        for p in purchases
    ]
