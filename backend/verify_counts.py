import asyncio
from sqlalchemy import text
from app.database import get_db_session

async def check_data():
    async with get_db_session() as db:
        tables = ["users", "writer_profiles", "sponsors", "sponsor_slots", "orders", "newspapers"]
        print("📊 Current Database Summary:")
        for table in tables:
            try:
                result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"  - {table}: {count}")
            except Exception as e:
                print(f"  - {table}: Error checking ({e})")

if __name__ == "__main__":
    import os
    if "DATABASE_URL" not in os.environ:
        os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./dream_newspaper.db"
    asyncio.run(check_data())
