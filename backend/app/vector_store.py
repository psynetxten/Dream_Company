from typing import List, Optional
import numpy as np
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, String, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.future import select
from app.database import Base, AsyncSessionLocal, engine
from app.config import settings
import google.generativeai as genai
import structlog

logger = structlog.get_logger()

# Gemini 설정 (임베딩용)
if hasattr(settings, "GOOGLE_API_KEY") and settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

class VectorItem(Base):
    __tablename__ = "vector_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_name: Mapped[str] = mapped_column(String(50), index=True)
    external_id: Mapped[str] = mapped_column(String(255), index=True)
    document: Mapped[str] = mapped_column(String)
    metadata_json: Mapped[dict] = mapped_column(JSON)
    embedding: Mapped[np.ndarray] = mapped_column(Vector(3072)) # Gemini embedding-001 is 3072d

# 컬렉션 이름 상수
COMPANIES_COLLECTION = "companies"
NEWSPAPER_MEMORY_COLLECTION = "newspaper_memory"

async def get_embedding(text: str) -> List[float]:
    """Gemini를 사용한 텍스트 임베딩 생성 (Free Tier)"""
    try:
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        logger.error("embedding_generation_failed", error=str(e))
        # 폴백: 랜덤 벡터 (테스트용)
        return np.random.uniform(-1, 1, 3072).tolist()

async def add_to_vector_store(collection_name: str, ids: List[str], documents: List[str], metadatas: List[dict]):
    """Supabase pgvector에 데이터 저장"""
    async with AsyncSessionLocal() as session:
        for i, (id_val, doc, meta) in enumerate(zip(ids, documents, metadatas)):
            embedding = await get_embedding(doc)
            item = VectorItem(
                collection_name=collection_name,
                external_id=id_val,
                document=doc,
                metadata_json=meta,
                embedding=embedding
            )
            session.add(item)
        await session.commit()

async def query_vector_store(collection_name: str, query_text: str, n_results: int = 5):
    """Supabase pgvector에서 유사도 검색"""
    query_embedding = await get_embedding(query_text)
    
    async with AsyncSessionLocal() as session:
        # l2_distance or cosine_distance
        stmt = select(VectorItem).where(
            VectorItem.collection_name == collection_name
        ).order_by(
            VectorItem.embedding.cosine_distance(query_embedding)
        ).limit(n_results)
        
        result = await session.execute(stmt)
        items = result.scalars().all()
        
        return {
            "ids": [[item.external_id for item in items]],
            "documents": [[item.document for item in items]],
            "metadatas": [[item.metadata_json for item in items]],
            "distances": [[0.0 for _ in items]] # Distance calculation could be added if needed
        }

# ChromaDB 호환성을 위한 하이브리드 인터페이스 (필요 시 유지)
def get_or_create_collection(name: str, metadata: dict = None):
    """ChromaDB 스타일의 더미 인터페이스 (마이그레이션용)"""
    class SupabaseCollectionMock:
        def query(self, query_texts, n_results, include=None):
            # 동기 래퍼가 필요할 수 있음 (또는 에이전트 수정)
            import asyncio
            return asyncio.run(query_vector_store(name, query_texts[0], n_results))
        
        def count(self):
            return 100 # Dummy
            
        def add(self, ids, documents, metadatas):
            import asyncio
            asyncio.run(add_to_vector_store(name, ids, documents, metadatas))

    return SupabaseCollectionMock()
