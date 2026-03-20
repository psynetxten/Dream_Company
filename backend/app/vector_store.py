from typing import List, Optional
import numpy as np
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, String, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.future import select
from app.database import Base, AsyncSessionLocal, engine
from app.config import settings
from google import genai
from google.genai import types
import structlog

logger = structlog.get_logger()

_embed_client: genai.Client | None = None

def _get_embed_client() -> genai.Client:
    global _embed_client
    if _embed_client is None:
        _embed_client = genai.Client(api_key=settings.GOOGLE_API_KEY)
    return _embed_client

class VectorItem(Base):
    __tablename__ = "vector_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_name: Mapped[str] = mapped_column(String(50), index=True)
    external_id: Mapped[str] = mapped_column(String(255), index=True)
    document: Mapped[str] = mapped_column(String)
    metadata_json: Mapped[dict] = mapped_column(JSON)
    
    # Supabase/Postgres 사용 시 Vector(3072) 사용, 아닐 경우 JSON 처리
    if "postgresql" in settings.DATABASE_URL:
        from pgvector.sqlalchemy import Vector
        embedding: Mapped[np.ndarray] = mapped_column(Vector(3072))
    else:
        # SQLite 등에서는 JSON 또는 BLOB으로 저장
        embedding: Mapped[np.ndarray] = mapped_column(JSON)

# 컬렉션 이름 상수
COMPANIES_COLLECTION = "companies"
NEWSPAPER_MEMORY_COLLECTION = "newspaper_memory"

async def get_embedding(text: str) -> List[float]:
    """Gemini를 사용한 텍스트 임베딩 생성 (Free Tier)"""
    if not hasattr(settings, "GOOGLE_API_KEY") or not settings.GOOGLE_API_KEY:
        logger.warning("google_api_key_not_set_using_random_vector")
        return np.random.uniform(-1, 1, 3072).tolist()
        
    try:
        client = _get_embed_client()
        result = client.models.embed_content(
            model="models/gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        return result.embeddings[0].values
    except Exception as e:
        logger.error("embedding_generation_failed", error=str(e))
        return np.random.uniform(-1, 1, 3072).tolist()

async def add_to_vector_store(collection_name: str, ids: List[str], documents: List[str], metadatas: List[dict]):
    """Supabase pgvector에 데이터 저장"""
    async with AsyncSessionLocal() as session:
        for i, (id_val, doc, meta) in enumerate(zip(ids, documents, metadatas)):
            embedding = await get_embedding(doc)
            # 기존에 있는지 확인 후 업데이트 또는 삽입 (external_id 기준)
            stmt = select(VectorItem).where(
                VectorItem.collection_name == collection_name,
                VectorItem.external_id == id_val
            )
            result = await session.execute(stmt)
            existing_item = result.scalar_one_or_none()
            
            if existing_item:
                existing_item.document = doc
                existing_item.metadata_json = meta
                existing_item.embedding = embedding
            else:
                item = VectorItem(
                    collection_name=collection_name,
                    external_id=id_val,
                    document=doc,
                    metadata_json=meta,
                    embedding=embedding
                )
                session.add(item)
        await session.commit()

async def query_vector_store(collection_name: str, query_text: str, n_results: int = 5) -> dict:
    """벡터 검색 실행 (Postgres pgvector 및 SQLite 폴백 지원)"""
    embedding = await get_embedding(query_text)
    
    async with AsyncSessionLocal() as session:
        # Postgres/pgvector 사용 시
        if "postgresql" in settings.DATABASE_URL:
            from pgvector.sqlalchemy import Vector
            from sqlalchemy import cast, literal
            distance_col = VectorItem.embedding.cosine_distance(embedding).label("distance")
            query = (
                select(VectorItem, distance_col)
                .where(VectorItem.collection_name == collection_name)
                .order_by(distance_col)
                .limit(n_results)
            )

            result = await session.execute(query)
            rows = result.all()

            return {
                "ids": [[row[0].external_id for row in rows]],
                "documents": [[row[0].document for row in rows]],
                "metadatas": [[row[0].metadata_json for row in rows]],
                "distances": [[float(row[1]) for row in rows]],
            }
        
        # SQLite 등 폴백: 전체 로드 후 Python에서 계산 (소규모 테스트용)
        else:
            query = select(VectorItem).where(VectorItem.collection_name == collection_name)
            result = await session.execute(query)
            all_items = result.scalars().all()
            
            if not all_items:
                return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}
                
            # 코사인 유사도 계산 (1 - 거리)
            def cosine_similarity(a, b):
                a = np.array(a)
                b = np.array(b)
                return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
            
            scored_items = []
            for item in all_items:
                # SQLite 저장된 JSON 문자열 -> 리스트 변환 확인
                emb = item.embedding
                if isinstance(emb, str):
                    emb = json.loads(emb)
                
                sim = cosine_similarity(embedding, emb)
                scored_items.append((item, 1 - sim)) # 거리 = 1 - 유사도
            
            # 거리 순 정렬
            scored_items.sort(key=lambda x: x[1])
            top_items = scored_items[:n_results]
            
            return {
                "ids": [[it[0].external_id for it in top_items]],
                "documents": [[it[0].document for it in top_items]],
                "metadatas": [[it[0].metadata_json for it in top_items]],
                "distances": [[it[1] for it in top_items]],
            }
