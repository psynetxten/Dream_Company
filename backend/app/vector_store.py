import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from functools import lru_cache


# ============================
# ChromaDB 클라이언트 (싱글톤)
# ============================
@lru_cache(maxsize=1)
def get_chroma_client() -> chromadb.HttpClient:
    """ChromaDB HTTP 클라이언트 반환 (싱글톤)"""
    client_settings = ChromaSettings(
        anonymized_telemetry=False,
    )

    if settings.CHROMA_AUTH_TOKEN:
        return chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(
                chroma_client_auth_provider="chromadb.auth.token.TokenAuthClientProvider",
                chroma_client_auth_credentials=settings.CHROMA_AUTH_TOKEN,
                anonymized_telemetry=False,
            ),
        )

    return chromadb.HttpClient(
        host=settings.CHROMA_HOST,
        port=settings.CHROMA_PORT,
        settings=client_settings,
    )


# ============================
# 컬렉션 이름 상수
# ============================
COMPANIES_COLLECTION = "companies"
NEWSPAPER_MEMORY_COLLECTION = "newspaper_memory"


def get_or_create_collection(name: str, metadata: dict = None):
    """컬렉션 가져오기 또는 생성"""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=name,
        metadata=metadata or {"hnsw:space": "cosine"},
    )
