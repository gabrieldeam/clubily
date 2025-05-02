from supabase import create_client, Client
from .config import settings

supabase_url: str = settings.SUPABASE_URL
supabase_key: str = settings.SUPABASE_SERVICE_ROLE_KEY # Use service role for backend operations

supabase: Client = create_client(supabase_url, supabase_key)

# Optional: Function to get a client instance if needed elsewhere
def get_supabase_client() -> Client:
    return supabase

