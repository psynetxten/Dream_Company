import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Try different connection strings
load_dotenv()

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
    # 1. Transaction Pooler (Current)
    pooler_url = "postgresql://postgres.qzlcpfrhwjgjafdafrva:nn524jj930%2A%2A@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
    await test_conn(pooler_url, "Transaction Pooler (6543)")

    # 2. Session Pooler (5432)
    session_url = "postgresql://postgres.qzlcpfrhwjgjafdafrva:nn524jj930%2A%2A@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
    await test_conn(session_url, "Session Pooler (5432)")

    # 3. Direct Connection (maybe)
    direct_url = "postgresql://postgres:nn524jj930%2A%2A@db.qzlcpfrhwjgjafdafrva.supabase.co:5432/postgres"
    await test_conn(direct_url, "Direct Host (5432)")

if __name__ == "__main__":
    asyncio.run(run())
