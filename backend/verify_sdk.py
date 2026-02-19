import asyncio
from app.config import settings
from supabase import create_client, Client

async def verify_sdk():
    print("Verifying via Supabase SDK...")
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    try:
        # Check count
        res = supabase.table("vector_items").select("*", count="exact").eq("collection_name", "companies").execute()
        print(f"Total companies in Supabase: {res.count}")
        
        # Check a few records
        if res.count > 0:
            print("First 3 records:")
            for item in res.data[:3]:
                print(f"- {item['external_id']}: {item['document'][:50]}...")
        else:
            print("Zero records found in vector_items table!")

    except Exception as e:
        print(f"SDK Verification failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify_sdk())
