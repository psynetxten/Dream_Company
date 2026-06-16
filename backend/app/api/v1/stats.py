from fastapi import APIRouter
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.newspaper import Newspaper
from app.models.sponsor import Sponsor
from app.models.order import Order
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
async def get_public_stats(db: AsyncSession = Depends(get_db)):
    user_count = await db.scalar(select(func.count()).select_from(User))
    newspaper_count = await db.scalar(select(func.count()).select_from(Newspaper))
    sponsor_count = await db.scalar(select(func.count()).select_from(Sponsor))
    order_count = await db.scalar(select(func.count()).select_from(Order))
    return {
        "user_count": user_count or 0,
        "newspaper_count": newspaper_count or 0,
        "sponsor_count": sponsor_count or 0,
        "order_count": order_count or 0,
    }
