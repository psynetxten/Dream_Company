
import os
import jwt
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

url = os.getenv("SUPABASE_URL")
anon_key = os.getenv("SUPABASE_ANON_KEY")
service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {url}")
print(f"Anon Key Preview: {anon_key[:10]}...")
print(f"Service Role Key Preview: {service_role_key[:10]}...")

try:
    # Decode JWT to check project reference
    decoded = jwt.decode(service_role_key, options={"verify_signature": False})
    print(f"Decoded Service Role Key: {decoded}")
    project_ref = decoded.get("ref")
    print(f"Project Ref from Key: {project_ref}")
except Exception as e:
    print(f"Failed to decode key: {e}")

# Try to list users using service role (Admin access)
try:
    supabase: Client = create_client(url, service_role_key)
    users = supabase.auth.admin.list_users()
    print(f"Successfully connected as Admin. Total users found: {len(users)}")
    
    # Try to create a test user as Admin
    print("\nAttempting to create a test user via Admin API...")
    test_email = f"cto_test_{int(datetime.now().timestamp())}@example.com"
    new_user = supabase.auth.admin.create_user({
        "email": test_email,
        "password": "Password123!",
        "email_confirm": True
    })
    print(f"Admin User Creation: Success! User ID: {new_user.user.id}")
    
    # Cleanup
    supabase.auth.admin.delete_user(new_user.user.id)
    print("Cleanup: Deleted test user.")
except Exception as e:
    print(f"Admin API Failure: {e}")

# Try to simulate an anon request
try:
    supabase_anon: Client = create_client(url, anon_key)
    res = supabase_anon.from_("newspapers").select("id", count="exact").limit(1).execute()
    print("\nAnon Key check: Success! Connection established.")
except Exception as e:
    print(f"Anon Key check: FAILED! Error: {e}")
