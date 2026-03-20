
import asyncio
import uuid
import json
from app.database import AsyncSessionLocal, init_db, Base
from app.models.sponsor import Sponsor, SponsorSlot
from app.models.user import User
from app.agents.ad_sales.agent import AdSales
from sqlalchemy import select, delete

async def verify_matching():
    print("Initializing DB...")
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # 1. 기존 데이터 정리 (테스트용)
        await session.execute(delete(SponsorSlot))
        await session.execute(delete(Sponsor))
        await session.commit()
        
        # 2. 테스트용 유저 및 유료 스폰서 생성
        print("Creating dummy paid sponsor...")
        user_id = uuid.uuid4()
        test_user = User(
            id=user_id,
            email=f"sponsor_{uuid.uuid4().hex[:6]}@test.com",
            full_name="Test Sponsor User",
            role="sponsor"
        )
        session.add(test_user)
        
        sponsor_id = uuid.uuid4()
        test_sponsor = Sponsor(
            id=sponsor_id,
            user_id=user_id,
            company_name="Dream Tech Academy",
            industry="Education",
            description="AI 부트캠프 및 커리어 전환 전문 아카데미",
            is_active=True
        )
        session.add(test_sponsor)
        
        slot = SponsorSlot(
            id=uuid.uuid4(),
            sponsor_id=sponsor_id,
            slot_type="company_name",
            purchased_quantity=10,
            remaining_quantity=10,
            price_per_unit=1000,
            total_amount=10000,
            payment_status="paid"
        )
        session.add(slot)
        await session.commit()
        print(f"Paid sponsor created: {test_sponsor.company_name}")

    # 3. 매칭 에이전트 실행
    print("\nRunning AdSales...")
    agent = AdSales()
    
    order = {
        "protagonist_name": "김철수",
        "dream_description": "나는 세계 최고의 AI 엔지니어가 되어서 실리콘밸리에서 일하고 싶어.",
        "target_role": "AI 엔지니어",
        "target_company": "Google"
    }
    
    sponsors = await agent.find_sponsors(order)
    
    print("\nMatched Sponsors:")
    print(json.dumps(sponsors, ensure_ascii=False, indent=2))
    
    # 검증
    paid_matched = any(s.get("is_paid") is True or "Dream Tech" in s["company_name"] for s in sponsors)
    if paid_matched:
        print("\n✅ Success: Paid sponsor was matched!")
    else:
        print("\n❌ Failure: Paid sponsor was NOT matched.")

if __name__ == "__main__":
    import os
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./dream_newspaper.db"
    asyncio.run(verify_matching())
