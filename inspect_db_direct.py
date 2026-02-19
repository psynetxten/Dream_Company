
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")

print(f"Connecting to: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("Connected successfully!")
    
    # Check tables in auth schema
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth'")
    tables = cur.fetchall()
    print("\nAuth Schema Tables:")
    for t in tables:
        print(f"- {t[0]}")
    
    # Check if we can find any specific config table
    # Supabase doesn't usually store GoTrue config in tables accessible this way, 
    # but let's check users again.
    cur.execute("SELECT count(*) FROM auth.users")
    print(f"User count: {cur.fetchone()[0]}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
