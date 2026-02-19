import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def check_extension():
    async with AsyncSessionLocal() as session:
        try:
            # Check extensions
            ext_result = await session.execute(text("SELECT extname FROM pg_extension"))
            extensions = [r[0] for r in ext_result.fetchall()]
            print(f"Installed extensions: {extensions}")
            
            # Check types
            type_result = await session.execute(text("SELECT typname FROM pg_type WHERE typname = 'vector'"))
            types = [r[0] for r in type_result.fetchall()]
            print(f"Vector type exists: {len(types) > 0}")
            
            if "vector" not in extensions:
                print("Missing 'vector' extension in pg_extension table.")
            
        except Exception as e:
            print(f"Error checking extension: {e}")

if __name__ == "__main__":
    asyncio.run(check_extension())
