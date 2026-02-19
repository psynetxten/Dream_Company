
import asyncio
import os
import asyncpg
from dotenv import load_dotenv
import urllib.parse

load_dotenv()

# The password in .env might be double-encoded or literal.
# Let's try to parse the URL correctly.
raw_url = os.getenv("DATABASE_URL")
print(f"Original URL: {raw_url}")

# Manual parsing to be safe
# format: postgresql://user:password@host:port/dbname
try:
    # Handle the password encoding carefully
    # The password is likely 'nn524jj930**'
    user = "postgres"
    password = "nn524jj930**"
    host = "db.qzlcpfrhwjgjafdafrva.supabase.co"
    port = 5432
    database = "postgres"
    
    async def run():
        print(f"Connecting to {host} as {user}...")
        try:
            conn = await asyncpg.connect(
                user=user,
                password=password,
                database=database,
                host=host,
                port=port,
                ssl='require'
            )
            print("Connected SUCCESS!")
            
            # Check for config table
            try:
                rows = await conn.fetch("SELECT * FROM auth.config LIMIT 1")
                print("\nAuth Config found!")
            except:
                print("\nAuth Config table not found or not accessible.")
                
            # Check tables
            rows = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth'")
            print("\nAuth Tables:")
            for r in rows:
                print(f"- {r['table_name']}")
                
            await conn.close()
        except Exception as e:
            print(f"Connection error: {e}")

    if __name__ == "__main__":
        asyncio.run(run())
except Exception as e:
    print(f"Setup error: {e}")
