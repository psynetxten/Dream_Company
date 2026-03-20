import asyncio
import asyncpg
import os
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()

# .env에서 읽기
PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "")
DB_PASSWORD  = os.getenv("SUPABASE_DB_PASSWORD", "")
DB_REGION    = os.getenv("SUPABASE_DB_REGION", "ap-northeast-2")

encoded_pw = quote(DB_PASSWORD, safe="")

async def test_conn(url, label):
    print(f"Testing {label}...")
    try:
        conn = await asyncpg.connect(url)
        res = await conn.fetchval("SELECT current_database()")
        print(f"SUCCESS: Connected to {res}")
        await conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

async def run():
    if not PROJECT_REF or not DB_PASSWORD:
        print("ERROR: SUPABASE_PROJECT_REF 또는 SUPABASE_DB_PASSWORD가 .env에 없습니다.")
        return

    # 1. Transaction Pooler
    pooler_url = f"postgresql://postgres.{PROJECT_REF}:{encoded_pw}@aws-0-{DB_REGION}.pooler.supabase.com:6543/postgres"
    await test_conn(pooler_url, "Transaction Pooler (6543)")

    # 2. Session Pooler
    session_url = f"postgresql://postgres.{PROJECT_REF}:{encoded_pw}@aws-0-{DB_REGION}.pooler.supabase.com:5432/postgres"
    await test_conn(session_url, "Session Pooler (5432)")

    # 3. Direct Connection
    direct_url = f"postgresql://postgres:{encoded_pw}@db.{PROJECT_REF}.supabase.co:5432/postgres"
    await test_conn(direct_url, "Direct Host (5432)")

if __name__ == "__main__":
    asyncio.run(run())
