from supabase import create_client, Client
from app.config import settings

def get_supabase() -> Client:
    # Use service role key if available for administrative tasks, otherwise anon key
    # For now, we use anon key as provided by User
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise ValueError("SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment or config")
    return create_client(settings.supabase_url, settings.supabase_anon_key)

supabase: Client = get_supabase()
