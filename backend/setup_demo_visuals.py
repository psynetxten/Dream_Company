
import asyncio
from sqlalchemy import select
from app.database import get_db_session, init_db
from app.models.user import User
from app.models.writer import WriterProfile
from app.models.order import Order
from app.models.newspaper import Newspaper
from datetime import datetime, date

async def setup_demo_data():
    await init_db()
    async with get_db_session() as db:
        # 1. 유저 (작가) 생성
        email = "demo_writer@dream.com"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                email=email,
                full_name="데모 작가",
                role="writer",
                is_active=True
            )
            db.add(user)
            await db.flush()
            
        # 2. 작가 프로필
        result = await db.execute(select(WriterProfile).where(WriterProfile.user_id == user.id))
        profile = result.scalar_one_or_none()
        if not profile:
            profile = WriterProfile(user_id=user.id, pen_name="꿈꾸는 소설가")
            db.add(profile)
            
        # 3. 진행 중인 의뢰 생성
        order_id = "demo-order-123"
        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            order = Order(
                id=order_id,
                user_id=user.id,
                protagonist_name="김철수",
                dream_description="전 세계를 누비는 여행 작가가 되고 싶습니다.",
                target_role="여행 작가",
                target_company="내셔널 지오그래픽",
                duration_days=7,
                writer_type="human",
                payment_type="one_time",
                payment_status="paid",
                assigned_writer_id=user.id,
                status="active"
            )
            db.add(order)
            await db.flush()

        # 4. 에피소드(신문) 초안 생성
        result = await db.execute(select(Newspaper).where(Newspaper.order_id == order_id))
        if not result.scalars().first():
            paper = Newspaper(
                order_id=order_id,
                episode_number=1,
                future_date=date(2030, 1, 1),
                headline="김철수, 남극 탐험기 '얼어붙은 거인' 출간",
                subhead="AI 기자단이 뽑은 올해의 기대작... 첫날부터 매진 사례",
                lead_paragraph="2030년 새해 첫날, 여행 작가 김철수의 신작이 베일을 벗었다.",
                body_content="북극에서 남극까지, 그의 발길이 닿지 않은 곳은 없다. 이번 신작 '얼어붙은 거인'은...",
                status="draft"
            )
            db.add(paper)
            
        await db.commit()
        print(f"✅ Demo Data Ready: Order ID {order_id}")

if __name__ == "__main__":
    import os
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./dream_newspaper.db"
    asyncio.run(setup_demo_data())
