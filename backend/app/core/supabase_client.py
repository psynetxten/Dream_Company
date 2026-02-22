from supabase import create_client, Client
from app.config import settings

_supabase_client: Client | None = None

def get_supabase() -> Client:
    """Lazy init: env 변수가 없으면 None 반환, 애플 긭운 대신 에러 정보를 로깅"""
    global _supabase_client
    if _supabase_client is None:
        url = settings.supabase_url
        key = settings.supabase_anon_key
        if not url or not key:
            raise ValueError("SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.")
        _supabase_client = create_client(url, key)
    return _supabase_client

# Admin 클라이언트 (Service Role Key 사용)
def get_supabase_admin() -> Client:
    """Admin 권한이 필요한 작업에 사용"""
    url = settings.supabase_url
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not url or not service_key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.")
    return create_client(url, service_key)

# 모듈 레벨에서 supabase 변수 사용하는 코드 호환성
# (기존 `from app.core.supabase_client import supabase` 패턴 지원)
class _LazySupabase:
    def __getattr__(self, name):
        return getattr(get_supabase(), name)

supabase = _LazySupabase()
