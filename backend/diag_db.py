import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal, engine

async def diag():
    async with AsyncSessionLocal() as session:
        try:
            # 1. Basic Info
            res = await session.execute(text("SELECT current_database(), current_user, version()"))
            db, user, ver = res.fetchone()
            print(f"Connected to: {db} as {user}")
            print(f"PostgreSQL version: {ver}")
            
            # 2. Extensions
            res = await session.execute(text("SELECT extname, nspname FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid"))
            exts = res.fetchall()
            print(f"Extensions: {exts}")
            
            # 3. Schemas
            res = await session.execute(text("SELECT schema_name FROM information_schema.schemata"))
            schemas = [r[0] for r in res.fetchall()]
            print(f"Schemas: {schemas}")
            
            # 4. Search Path
            res = await session.execute(text("SHOW search_path"))
            path = res.fetchone()[0]
            print(f"Search Path: {path}")

        except Exception as e:
            print(f"Diagnostic failed: {e}")

if __name__ == "__main__":
    asyncio.run(diag())
