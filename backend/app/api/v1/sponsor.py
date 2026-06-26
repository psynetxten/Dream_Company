from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.sponsor import Sponsor, SponsorSlot
from app.models.newspaper import Newspaper
from app.models.user import User
from app.api.v1.auth import require_role, get_current_user
from app.schemas.sponsor import SponsorCreate, SponsorResponse, SlotCreate, SlotResponse, SponsorAnalytics
from typing import List
import uuid
import structlog

log = structlog.get_logger()
router = APIRouter(prefix="/sponsor", tags=["sponsor"])


# ────────────────────────────────
# 스폰서 등록
# ────────────────────────────────

@router.post("/register", response_model=SponsorResponse, status_code=status.HTTP_201_CREATED)
async def register_sponsor(
    body: SponsorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """기업 스폰서로 등록. 이미 등록된 경우 기존 프로필 반환."""
    existing = await db.execute(select(Sponsor).where(Sponsor.user_id == current_user.id))
    profile = existing.scalar_one_or_none()

    if profile:
        # 이미 존재 → 정보 업데이트
        profile.company_name = body.company_name
        profile.industry = body.industry
        profile.description = body.description
        profile.website_url = body.website_url
        profile.contact_email = body.contact_email
        profile.target_roles = body.target_roles
        profile.target_companies = body.target_companies
        profile.target_keywords = body.target_keywords
    else:
        profile = Sponsor(
            user_id=current_user.id,
            company_name=body.company_name,
            industry=body.industry,
            description=body.description,
            website_url=body.website_url,
            contact_email=body.contact_email,
            target_roles=body.target_roles,
            target_companies=body.target_companies,
            target_keywords=body.target_keywords,
        )
        db.add(profile)

    # 스폰서 등록 시 user role 자동 업그레이드
    if current_user.role not in ("sponsor", "admin"):
        current_user.role = "sponsor"

    await db.commit()
    await db.refresh(profile)

    # ChromaDB 벡터 스토어에도 동기화 (비동기 백그라운드)
    try:
        from app.vector_store import add_to_vector_store, COMPANIES_COLLECTION
        doc_text = (
            f"Name: {profile.company_name}\n"
            f"Industry: {profile.industry or ''}\n"
            f"Description: {profile.description or ''}\n"
            f"Keywords: {', '.join(profile.target_keywords)}\n"
            f"Target Roles: {', '.join(profile.target_roles)}"
        )
        await add_to_vector_store(
            COMPANIES_COLLECTION,
            ids=[str(profile.id)],
            documents=[doc_text],
            metadatas=[{"name": profile.company_name, "industry": profile.industry or ""}],
        )
        log.info("sponsor_vector_synced", company=profile.company_name)
    except Exception as e:
        log.warning("sponsor_vector_sync_failed", error=str(e))

    log.info("sponsor_registered", company=profile.company_name, user=str(current_user.id))
    return profile


# ────────────────────────────────
# 슬롯 구매
# ────────────────────────────────

@router.post("/slots", response_model=SlotResponse, status_code=status.HTTP_201_CREATED)
async def purchase_slot(
    body: SlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("sponsor", "admin")),
):
    """광고 슬롯 구매. 현재는 무료로 즉시 활성화."""
    VALID_SLOT_TYPES = {"company_name", "brand_name", "banner", "sidebar"}
    if body.slot_type not in VALID_SLOT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"슬롯 타입은 {VALID_SLOT_TYPES} 중 하나여야 합니다.",
        )

    sponsor_result = await db.execute(select(Sponsor).where(Sponsor.user_id == current_user.id))
    sponsor = sponsor_result.scalar_one_or_none()
    if not sponsor:
        raise HTTPException(status_code=404, detail="스폰서 프로필을 먼저 등록하세요. POST /sponsor/register")

    slot = SponsorSlot(
        sponsor_id=sponsor.id,
        slot_type=body.slot_type,
        variable_value=body.variable_value,
        purchased_quantity=body.purchased_quantity,
        remaining_quantity=body.purchased_quantity,
        price_per_unit=0,        # 무료 티어
        total_amount=0,
        payment_status="paid",   # 무료 → 즉시 활성화
        is_auto_matched=True,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)

    log.info("slot_purchased", slot_type=body.slot_type, company=sponsor.company_name)
    return slot


# ────────────────────────────────
# 분석 (Analytics)
# ────────────────────────────────

@router.get("/analytics", response_model=SponsorAnalytics)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("sponsor", "admin")),
):
    """스폰서 노출 통계 조회"""
    sponsor_result = await db.execute(select(Sponsor).where(Sponsor.user_id == current_user.id))
    sponsor = sponsor_result.scalar_one_or_none()
    if not sponsor:
        raise HTTPException(status_code=404, detail="스폰서 프로필이 없습니다.")

    # 슬롯 통계
    slots_result = await db.execute(select(SponsorSlot).where(SponsorSlot.sponsor_id == sponsor.id))
    slots = slots_result.scalars().all()

    total_slots = len(slots)
    active_slots = sum(1 for s in slots if s.remaining_quantity > 0 and s.payment_status == "paid")
    total_purchased = sum(s.purchased_quantity for s in slots)
    total_remaining = sum(s.remaining_quantity for s in slots)
    total_exposures = total_purchased - total_remaining  # 사용된 슬롯 = 노출 횟수

    # 신문 노출 편수
    slot_ids = [s.id for s in slots]
    if slot_ids:
        newspapers_result = await db.execute(
            select(func.count(Newspaper.id)).where(Newspaper.sponsor_slot_id.in_(slot_ids))
        )
        newspapers_featured = newspapers_result.scalar() or 0
    else:
        newspapers_featured = 0

    return SponsorAnalytics(
        company_name=sponsor.company_name,
        total_slots=total_slots,
        active_slots=active_slots,
        total_exposures=total_exposures,
        newspapers_featured=newspapers_featured,
        remaining_impressions=total_remaining,
    )


# ────────────────────────────────
# 기존 READ 엔드포인트
# ────────────────────────────────

@router.get("/me", response_model=SponsorResponse)
async def get_sponsor_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("sponsor", "admin")),
):
    """자신의 스폰서 프로필 조회"""
    result = await db.execute(select(Sponsor).where(Sponsor.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="스폰서 프로필을 찾을 수 없습니다.")
    return profile


@router.get("/slots", response_model=List[SlotResponse])
async def get_sponsor_slots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("sponsor", "admin")),
):
    """보유한 스폰서 슬롯 목록 조회"""
    sponsor_result = await db.execute(select(Sponsor.id).where(Sponsor.user_id == current_user.id))
    sponsor_id = sponsor_result.scalar_one_or_none()
    if not sponsor_id:
        return []
    result = await db.execute(select(SponsorSlot).where(SponsorSlot.sponsor_id == sponsor_id))
    return result.scalars().all()


@router.get("/matches")
async def get_sponsor_matches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("sponsor", "admin")),
):
    """내 스폰서십이 적용된 신문 목록 조회"""
    sponsor_result = await db.execute(select(Sponsor.id).where(Sponsor.user_id == current_user.id))
    sponsor_id = sponsor_result.scalar_one_or_none()
    if not sponsor_id:
        return []
    slot_ids_result = await db.execute(select(SponsorSlot.id).where(SponsorSlot.sponsor_id == sponsor_id))
    slot_ids = slot_ids_result.scalars().all()
    if not slot_ids:
        return []
    result = await db.execute(select(Newspaper).where(Newspaper.sponsor_slot_id.in_(slot_ids)))
    return result.scalars().all()
