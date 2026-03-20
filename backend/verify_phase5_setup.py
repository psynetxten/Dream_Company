
import asyncio
from sqlalchemy import select
from app.database import get_db_session
from app.models.user import User
from app.models.writer import WriterProfile
from app.models.order import Order
import uuid

async def setup_test_writer():
    async with get_db_session() as db:
        # 1. 작가 유저 생성 (이미 있을 수 있음)
        email = "writer@dream.com"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                email=email,
                full_name="Professional Writer",
                role="writer",
                is_active=True
            )
            db.add(user)
            await db.flush()
            
        # 2. 작가 프로필 생성
        result = await db.execute(select(WriterProfile).where(WriterProfile.user_id == user.id))
        profile = result.scalar_one_or_none()
        if not profile:
            profile = WriterProfile(user_id=user.id, pen_name="DreamWeaver")
            db.add(profile)
            
        # 3. 테스트용 Human Tier 주문 생성
        order = Order(
            user_id=user.id,
            protagonist_name="Verification Guy",
            dream_description="I want to be a CTO of a global space company.",
            target_role="CTO",
            target_company="SpaceX",
            duration_days=7,
            writer_type="human",
            payment_type="one_time",
            payment_status="paid",
            status="draft"
        )
        db.add(order)
        
        await db.commit()
        print(f"✅ Setup complete: Writer({email}), Order({order.id})")
        return user.id, order.id

if __name__ == "__main__":
    import os
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./dream_newspaper.db"
    asyncio.run(setup_test_writer())
