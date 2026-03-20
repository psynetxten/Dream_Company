import asyncio
import uuid
import json
from datetime import datetime, date, time, timedelta
from sqlalchemy import select, text
from app.database import get_db_session, init_db
from app.models.user import User
from app.models.writer import WriterProfile
from app.models.sponsor import Sponsor, SponsorSlot
from app.models.order import Order
from app.models.newspaper import Newspaper

async def seed_data():
    async with get_db_session() as db:
        print("🧹 Clearing existing data...")
        await db.execute(text("DELETE FROM newspapers"))
        await db.execute(text("DELETE FROM sponsor_slots"))
        await db.execute(text("DELETE FROM sponsors"))
        await db.execute(text("DELETE FROM orders"))
        await db.execute(text("DELETE FROM writer_profiles"))
        await db.execute(text("DELETE FROM users"))
        await db.commit()
        
    async with get_db_session() as db:
        print("🌱 Seeding Simulation Data...")

        # 1. Create Users
        users_to_create = [
            {"email": "user@example.com", "full_name": "일반 유저", "role": "user"},
            {"email": "writer@example.com", "full_name": "전문 작가", "role": "writer"},
            {"email": "sponsor@example.com", "full_name": "스폰서 담당자", "role": "sponsor"},
        ]
        
        created_users = {}
        for u_data in users_to_create:
            result = await db.execute(select(User).where(User.email == u_data["email"]))
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    email=u_data["email"],
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                await db.flush()
                print(f"✅ Created User: {u_data['email']}")
            created_users[u_data["role"]] = user

        # 2. Writer Profile
        writer_user = created_users["writer"]
        result = await db.execute(select(WriterProfile).where(WriterProfile.user_id == writer_user.id))
        writer_profile = result.scalar_one_or_none()
        if not writer_profile:
            writer_profile = WriterProfile(
                user_id=writer_user.id,
                pen_name="꿈결 작가",
                bio="당신의 꿈을 현실적인 미래로 그려드립니다.",
                specialties=["career", "life", "travel"]
            )
            db.add(writer_profile)
            print("✅ Created Writer Profile")

        # 3. Sponsor & Slots
        sponsor_user = created_users["sponsor"]
        result = await db.execute(select(Sponsor).where(Sponsor.user_id == sponsor_user.id))
        sponsor = result.scalar_one_or_none()
        if not sponsor:
            sponsor = Sponsor(
                user_id=sponsor_user.id,
                company_name="미래드림 IT",
                industry="IT/Software",
                description="내일을 준비하는 기술 선도 기업",
                website_url="https://future-dream.example.com",
                target_roles=json.dumps(["Software Engineer", "CTO", "Product Manager"]),
                target_companies=json.dumps([]),
                target_keywords=json.dumps([])
            )
            db.add(sponsor)
            await db.flush()
            print("✅ Created Sponsor")
            
            # Create Slots
            slots_data = [
                {"type": "banner", "value": "미래를 준비하는 코딩 캠프 1기 모집중!"},
                {"type": "sidebar", "value": "IT 트렌드 리포트 무료 배포"},
                {"type": "brand_name", "value": "미래드림 IT 아카데미"}
            ]
            for s_data in slots_data:
                slot = SponsorSlot(
                    sponsor_id=sponsor.id,
                    slot_type=s_data["type"],
                    variable_value=s_data["value"],
                    purchased_quantity=10,
                    remaining_quantity=10,
                    price_per_unit=50000,
                    total_amount=500000,
                    payment_status="paid"
                )
                db.add(slot)
            print("✅ Created Sponsor Slots")

        # 4. Orders
        regular_user = created_users["user"]
        
        # Order 1: Active (Human Writer)
        order_active_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        result = await db.execute(select(Order).where(Order.id == order_active_id))
        if not result.scalar_one_or_none():
            order_active = Order(
                id=order_active_id,
                user_id=regular_user.id,
                dream_description="전 세계를 여행하며 IT 기술을 전파하는 디지털 노마드가 되고 싶습니다.",
                protagonist_name="이민수",
                target_role="디지털 노마드 개발자",
                target_company="Google Open Source Team",
                duration_days=14,
                payment_type="one_time",
                payment_status="paid",
                assigned_writer_id=writer_user.id,
                writer_type="human",
                status="active",
                starts_at=datetime.now() - timedelta(days=5),
                ends_at=datetime.now() + timedelta(days=9),
                supporting_people=json.dumps([])
            )
            db.add(order_active)
            print("✅ Created Active Order")

        # Order 2: Completed (AI Writer)
        order_comp_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
        result = await db.execute(select(Order).where(Order.id == order_comp_id))
        if not result.scalar_one_or_none():
            order_comp = Order(
                id=order_comp_id,
                user_id=regular_user.id,
                dream_description="자서전을 쓰는 작가가 되고 싶습니다.",
                protagonist_name="이민수",
                target_role="베스트셀러 작가",
                duration_days=7,
                payment_type="one_time",
                payment_status="paid",
                writer_type="ai",
                status="completed",
                supporting_people=json.dumps([])
            )
            db.add(order_comp)
            print("✅ Created Completed Order")

        # Order 3: Pending Payment
        result = await db.execute(select(Order).where(Order.payment_status == "pending"))
        if not result.scalars().first():
            order_pending = Order(
                user_id=regular_user.id,
                dream_description="우주 여행 가이드가 되고 싶습니다.",
                protagonist_name="이민수",
                target_role="Space Guide",
                duration_days=30,
                payment_type="subscription",
                payment_status="pending",
                status="draft",
                supporting_people=json.dumps([])
            )
            db.add(order_pending)
            print("✅ Created Pending Order")

        await db.flush()

        # 5. Newspapers
        # Get one sponsor slot for matching
        result = await db.execute(select(SponsorSlot).limit(1))
        matched_slot = result.scalar_one_or_none()

        # Newspapers for Active Order
        for i in range(1, 6):
            paper = Newspaper(
                order_id=order_active_id,
                episode_number=i,
                future_date=date(2030, 3, i),
                headline=f"이민수의 디지털 노마드 도전기 #{i}",
                subhead="기술과 자유를 동시에 거머쥐다",
                lead_paragraph=f"{2030+i}년, 이민수는 발리에서 코딩을 하고 있습니다.",
                body_content="그의 코드는 전 세계에 영향을 미치고 있습니다...",
                status="published",
                published_at=datetime.now() - timedelta(days=5-i),
                sponsor_slot_id=matched_slot.id if matched_slot and i % 2 == 0 else None,
                sidebar_content=json.dumps({}),
                variables_used=json.dumps({}),
                sns_copy=json.dumps({})
            )
            db.add(paper)

        # Draft for Active Order
        db.add(Newspaper(
            order_id=order_active_id,
            episode_number=6,
            future_date=date(2030, 3, 6),
            headline="[초안] 이민수의 다음 목적지는?",
            status="draft",
            sidebar_content=json.dumps({}),
            variables_used=json.dumps({}),
            sns_copy=json.dumps({})
        ))

        # Newspapers for Completed Order
        for i in range(1, 8):
            paper = Newspaper(
                order_id=order_comp_id,
                episode_number=i,
                future_date=date(2029, 12, i),
                headline=f"베스트셀러 작가의 길 #{i}",
                status="published",
                published_at=datetime.now() - timedelta(days=30-i),
                sidebar_content=json.dumps({}),
                variables_used=json.dumps({}),
                sns_copy=json.dumps({})
            )
            db.add(paper)

        await db.commit()
        print("✨ Simulation Data Seeding Completed!")

if __name__ == "__main__":
    import os
    # Default local sqlite
    if "DATABASE_URL" not in os.environ:
        os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./dream_newspaper.db"
    asyncio.run(seed_data())
