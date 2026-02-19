import json
from app.agents.base_agent import BaseAgent
from app.vector_store import get_or_create_collection, COMPANIES_COLLECTION
from app.config import settings
import structlog

logger = structlog.get_logger()


class SponsorMatcherAgent(BaseAgent):
    """스폰서 자동 매칭 에이전트 - ChromaDB 벡터 검색 + Claude 판단"""

    def __init__(self):
        super().__init__(
            model=settings.SPONSOR_MODEL,
            max_tokens=1024,
            system_prompt="""
당신은 꿈신문사의 스폰서 매칭 전문가입니다.
사용자의 꿈과 가장 관련성 높은 기업을 3개 선택하고 이유를 설명합니다.
반드시 JSON 배열 형식으로만 반환하세요.
""",
            agent_name="sponsor_matcher",
        )

    def find_sponsors(self, order: dict) -> list[dict]:
        """
        ChromaDB에서 적합한 스폰서 검색 후 Claude가 최종 선택

        Args:
            order: {protagonist_name, dream_description, target_role, target_company}

        Returns:
            [{"company_name": "...", "slot_type": "company_name", "score": 0.95, "reason": "..."}]
        """
        # 1. 벡터 검색으로 후보 추출
        try:
            collection = get_or_create_collection(COMPANIES_COLLECTION)

            query_text = (
                f"{order.get('target_role', '')} "
                f"{order.get('target_company', '')} "
                f"{order.get('dream_description', '')}"
            )

            results = collection.query(
                query_texts=[query_text],
                n_results=min(10, collection.count() or 1),
                include=["documents", "metadatas", "distances"],
            )

            candidates = []
            if results["ids"] and results["ids"][0]:
                for meta, doc, dist in zip(
                    results["metadatas"][0],
                    results["documents"][0],
                    results["distances"][0],
                ):
                    candidates.append({
                        "company_name": meta.get("name", ""),
                        "industry": meta.get("industry", ""),
                        "description": doc[:200],
                        "similarity": round(1 - dist, 3),
                    })

        except Exception as e:
            logger.warning("chroma_search_failed", error=str(e))
            candidates = self._get_fallback_candidates(order)

        if not candidates:
            candidates = self._get_fallback_candidates(order)

        # 2. Claude가 최적 3개 선택
        prompt = f"""
사용자 정보:
- 꿈/목표: {order.get('dream_description', '')}
- 목표 직업: {order.get('target_role', '')}
- 목표 회사: {order.get('target_company', '없음')}

후보 기업 목록:
{json.dumps(candidates, ensure_ascii=False, indent=2)}

위 후보 중 이 사용자의 꿈신문에 스폰서로 가장 적합한 기업 3개를 선택하세요.
선택 기준: 직업/꿈과의 연관성, 브랜드 인지도, 독자 공감도

다음 JSON 배열만 반환하세요:
[
  {{"company_name": "회사명", "slot_type": "company_name", "score": 0.95, "reason": "선택 이유"}},
  ...
]
"""
        try:
            result_text = self.run_sync(prompt)

            # JSON 파싱
            start = result_text.find("[")
            end = result_text.rfind("]") + 1
            if start != -1 and end > start:
                sponsors = json.loads(result_text[start:end])
                logger.info("sponsor_match_success", count=len(sponsors))
                return sponsors[:3]

        except Exception as e:
            logger.error("sponsor_match_failed", error=str(e))

        # 폴백: 상위 3개 후보 반환
        return [
            {
                "company_name": c["company_name"],
                "slot_type": "company_name",
                "score": c["similarity"],
                "reason": "자동 매칭",
            }
            for c in candidates[:3]
        ]

    def _get_fallback_candidates(self, order: dict) -> list[dict]:
        """ChromaDB 연결 실패 시 폴백 후보"""
        target_company = order.get("target_company", "")
        target_role = order.get("target_role", "")

        # 직업 기반 기본 매칭
        fallbacks = []

        if any(kw in target_role for kw in ["개발", "엔지니어", "IT", "AI", "데이터"]):
            fallbacks = [
                {"company_name": "삼성전자", "industry": "IT", "description": "글로벌 IT 기업", "similarity": 0.9},
                {"company_name": "카카오", "industry": "IT", "description": "국내 IT 플랫폼", "similarity": 0.85},
                {"company_name": "네이버", "industry": "IT", "description": "검색/AI 기업", "similarity": 0.8},
            ]
        elif any(kw in target_role for kw in ["의사", "의료", "간호", "헬스"]):
            fallbacks = [
                {"company_name": "삼성서울병원", "industry": "의료", "description": "국내 최고 병원", "similarity": 0.9},
            ]
        else:
            fallbacks = [
                {"company_name": "삼성전자", "industry": "IT", "description": "글로벌 기업", "similarity": 0.7},
            ]

        if target_company:
            fallbacks.insert(0, {
                "company_name": target_company,
                "industry": "목표 기업",
                "description": f"사용자의 목표 기업",
                "similarity": 0.95,
            })

        return fallbacks
