
import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")

async def run():
    print(f"Connecting to {db_url}...")
    try:
        conn = await asyncpg.connect(db_url)
        print("Connected!")
        
        # Check schemas
        rows = await conn.fetch("SELECT schema_name FROM information_schema.schemata")
        print("\nSchemas:")
        for r in rows:
            print(f"- {r['schema_name']}")
            
        # Check auth tables
        rows = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth'")
        print("\nAuth Tables:")
        for r in rows:
            print(f"- {r['table_name']}")
            
        # Check if we have providers or config
        # Some versions have auth.providers
        try:
            rows = await conn.fetch("SELECT * FROM auth.providers")
            print("\nAuth Providers:")
            for r in rows:
                print(r)
        except Exception as e:
            print(f"\nCould not read auth.providers: {e}")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
