from supabase import create_client, Client
from app.config import settings

def get_supabase() -> Client:
    # Use service role key if available for administrative tasks, otherwise anon key
    # For now, we use anon key as provided by User
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

supabase: Client = get_supabase()
