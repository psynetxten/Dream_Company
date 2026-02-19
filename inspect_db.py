
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
# Convert to asyncpg
if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

async def check_auth_config():
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        print("Connected to Supabase DB.")
        
        # Check auth schema tables
        print("\nListing tables in 'auth' schema:")
        result = await conn.execute(text("SELECT table_name FROM v_tables WHERE table_schema = 'auth'"))
        # Wait, v_tables might not be standard. Use information_schema.
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth'"))
        for row in result:
            print(f"- {row[0]}")
            
        # Try to find config or identity providers
        # In newer Supabase, providers are often in 'auth.identities' or internal GoTrue state.
        # But 'auth.users' is a good start.
        result = await conn.execute(text("SELECT count(*) FROM auth.users"))
        user_count = result.scalar()
        print(f"\nUser count in auth.users: {user_count}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_auth_config())
