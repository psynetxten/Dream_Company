import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def verify_data():
    async with AsyncSessionLocal() as session:
        try:
            # Check count
            result = await session.execute(text("SELECT count(*) FROM vector_items WHERE collection_name = 'companies'"))
            count = result.scalar()
            print(f"Total companies loaded: {count}")
            
            # Check a sample query
            from app.vector_store import query_vector_store
            query_res = await query_vector_store("companies", "AI and Search technology", n_results=3)
            print("Sample Query Results (AI and Search):")
            for doc in query_res['documents'][0]:
                print(f"- {doc[:100]}...")

        except Exception as e:
            print(f"Verification failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify_data())
