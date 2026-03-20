import asyncio
from app.config import settings
from supabase import create_client, Client
from google import genai
from google.genai import types
import numpy as np

# 초기 글로벌 기업 데이터
INITIAL_COMPANIES = [
    {
        "id": "samsung_electronics",
        "name": "삼성전자",
        "industry": "전자/IT",
        "description": "글로벌 반도체, 스마트폰, 가전 선도기업. 소프트웨어 엔지니어, 하드웨어 엔지니어, AI 연구원 적극 채용 중.",
        "keywords": ["반도체", "스마트폰", "AI", "엔지니어", "IT", "전자공학"],
        "careers": ["소프트웨어 엔지니어", "하드웨어 엔지니어", "AI 연구원", "데이터 사이언티스트"],
    },
    {
        "id": "kakao",
        "name": "카카오",
        "industry": "IT/플랫폼",
        "description": "국민 메신저 카카오톡 운영사. 개발자, 디자이너, 프로덕트 매니저 채용 활발.",
        "keywords": ["메신저", "플랫폼", "IT", "개발자", "스타트업 문화", "핀테크"],
        "careers": ["백엔드 개발자", "프론트엔드 개발자", "프로덕트 매니저", "디자이너"],
    },
    {
        "id": "naver",
        "name": "네이버",
        "industry": "IT/검색/AI",
        "description": "국내 최대 검색 포털 및 AI 기술 선도기업. HyperCLOVA X 개발사.",
        "keywords": ["검색", "AI", "클라우드", "웹툰", "쇼핑", "네이버페이"],
        "careers": ["AI 엔지니어", "검색 개발자", "클라우드 엔지니어", "UX 디자이너"],
    },
    {
        "id": "hyundai_motor",
        "name": "현대자동차",
        "industry": "자동차/모빌리티",
        "description": "글로벌 자동차 그룹. 전기차, 수소차, 자율주행 분야 혁신 중.",
        "keywords": ["자동차", "전기차", "수소차", "모빌리티", "자율주행", "제조"],
        "careers": ["자동차 엔지니어", "소프트웨어 개발자", "디자이너", "연구원"],
    },
    {
        "id": "lg_electronics",
        "name": "LG전자",
        "industry": "전자/가전",
        "description": "글로벌 가전 및 전장 부품 리더. AI 가전, OLED TV 세계 1위.",
        "keywords": ["가전", "TV", "에어컨", "전장", "AI", "스마트홈"],
        "careers": ["전자 엔지니어", "AI 연구원", "UX 디자이너", "마케터"],
    },
    {
        "id": "sk_hynix",
        "name": "SK하이닉스",
        "industry": "반도체",
        "description": "세계 2위 메모리 반도체 기업. HBM(고대역폭메모리) 글로벌 1위.",
        "keywords": ["반도체", "메모리", "D램", "낸드", "AI칩", "HBM"],
        "careers": ["반도체 엔지니어", "공정 엔지니어", "연구원", "품질 관리"],
    },
    {
        "id": "coupang",
        "name": "쿠팡",
        "industry": "이커머스/물류",
        "description": "한국 최대 이커머스 기업. 로켓배송 혁신, 쿠팡이츠 운영.",
        "keywords": ["이커머스", "물류", "배달", "스타트업", "테크", "데이터"],
        "careers": ["소프트웨어 엔지니어", "데이터 엔지니어", "물류 기획", "프로덕트 매니저"],
    },
    {
        "id": "krafton",
        "name": "크래프톤",
        "industry": "게임",
        "description": "배틀그라운드 개발사. 글로벌 게임 IP 보유.",
        "keywords": ["게임", "PUBG", "메타버스", "인디게임", "게임 개발"],
        "careers": ["게임 개발자", "그래픽 아티스트", "게임 기획자", "QA 엔지니어"],
    },
    {
        "id": "google",
        "name": "Google",
        "industry": "IT/AI/검색",
        "description": "글로벌 검색엔진, AI(Gemini), 클라우드(GCP) 선도기업.",
        "keywords": ["AI", "검색", "클라우드", "유튜브", "안드로이드", "딥러닝"],
        "careers": ["소프트웨어 엔지니어", "AI/ML 엔지니어", "프로덕트 매니저", "UX 연구원"],
    },
    {
        "id": "microsoft",
        "name": "Microsoft",
        "industry": "IT/클라우드/AI",
        "description": "Azure 클라우드, Office 365, ChatGPT 파트너 OpenAI 투자사.",
        "keywords": ["클라우드", "Azure", "AI", "Office", "게임(Xbox)", "소프트웨어"],
        "careers": ["클라우드 엔지니어", "AI 엔지니어", "소프트웨어 개발자", "컨설턴트"],
    },
    {
        "id": "meta",
        "name": "Meta",
        "industry": "소셜미디어/AR/VR",
        "description": "Facebook, Instagram, WhatsApp 운영. AR/VR 메타버스 투자 중.",
        "keywords": ["소셜미디어", "메타버스", "VR", "AR", "AI", "광고"],
        "careers": ["소프트웨어 엔지니어", "AI 연구원", "제품 디자이너", "데이터 과학자"],
    },
    {
        "id": "apple",
        "name": "Apple",
        "industry": "IT/하드웨어/소프트웨어",
        "description": "iPhone, Mac, Apple Silicon 혁신. 프리미엄 소비자 기술 선도.",
        "keywords": ["iPhone", "Mac", "iOS", "디자인", "하드웨어", "소프트웨어"],
        "careers": ["iOS 개발자", "하드웨어 엔지니어", "UX/UI 디자이너", "ML 엔지니어"],
    },
    {
        "id": "amazon",
        "name": "Amazon",
        "industry": "이커머스/클라우드",
        "description": "세계 최대 이커머스 및 AWS 클라우드 서비스 운영.",
        "keywords": ["클라우드", "AWS", "이커머스", "물류", "AI", "프라임"],
        "careers": ["소프트웨어 엔지니어", "클라우드 아키텍트", "데이터 엔지니어", "PM"],
    },
    {
        "id": "tesla",
        "name": "Tesla",
        "industry": "전기차/에너지/AI",
        "description": "전기차 선도기업. 자율주행, 에너지 저장, 태양광 사업.",
        "keywords": ["전기차", "자율주행", "에너지", "AI", "배터리", "혁신"],
        "careers": ["소프트웨어 엔지니어", "자율주행 엔지니어", "배터리 엔지니어", "데이터 과학자"],
    },
    {
        "id": "openai",
        "name": "OpenAI",
        "industry": "AI 연구/제품",
        "description": "ChatGPT, GPT-4 개발사. AGI를 향한 AI 안전 연구 선도.",
        "keywords": ["AI", "LLM", "ChatGPT", "딥러닝", "연구", "AGI"],
        "careers": ["AI/ML 연구원", "소프트웨어 엔지니어", "프로덕트 매니저", "AI 안전 연구원"],
    },
    {
        "id": "mckinsey",
        "name": "McKinsey & Company",
        "industry": "컨설팅",
        "description": "글로벌 1위 경영 컨설팅 펌. 전략, 디지털 전환, AI 컨설팅.",
        "keywords": ["컨설팅", "전략", "경영", "MBA", "디지털전환", "글로벌"],
        "careers": ["경영 컨설턴트", "데이터 분석가", "전략 기획", "IT 컨설턴트"],
    },
    {
        "id": "goldman_sachs",
        "name": "Goldman Sachs",
        "industry": "금융/투자은행",
        "description": "글로벌 투자은행. 투자, M&A, 트레이딩, 자산관리.",
        "keywords": ["투자은행", "금융", "IB", "트레이딩", "자산관리", "핀테크"],
        "careers": ["투자 분석가", "퀀트 개발자", "트레이더", "리스크 매니저"],
    },
    {
        "id": "toss",
        "name": "토스(비바리퍼블리카)",
        "industry": "핀테크",
        "description": "국내 대표 핀테크 유니콘. 간편 송금, 토스뱅크, 토스증권 운영.",
        "keywords": ["핀테크", "금융", "스타트업", "앱", "페이먼트", "인터넷은행"],
        "careers": ["iOS/안드로이드 개발자", "백엔드 엔지니어", "디자이너", "PM"],
    },
    {
        "id": "anthropic",
        "name": "Anthropic",
        "industry": "AI 연구/제품",
        "description": "Claude AI 개발사. AI 안전과 유용성을 동시에 추구하는 AI 연구기업.",
        "keywords": ["AI", "Claude", "LLM", "AI 안전", "연구", "AGI"],
        "careers": ["AI 연구원", "소프트웨어 엔지니어", "프로덕트 매니저", "정책 연구원"],
    },
]

async def get_embedding(text: str):
    """Gemini를 사용한 텍스트 임베딩 생성"""
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)
    result = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    return result.embeddings[0].values

async def load_companies():
    """기업 데이터를 vector_store를 통해 로드 (DB 독립적)"""
    print("Starting data ingestion to vector store...")
    
    from app.vector_store import add_to_vector_store, COMPANIES_COLLECTION
    from app.database import init_db
    
    # 1. DB 초기화 (테이블 생성 확인)
    await init_db()
    
    ids = [c["id"] for c in INITIAL_COMPANIES]
    documents = []
    metadatas = []
    
    for company in INITIAL_COMPANIES:
        doc_text = f"Name: {company['name']}\nIndustry: {company['industry']}\nDescription: {company['description']}\nKeywords: {', '.join(company['keywords'])}\nCareers: {', '.join(company['careers'])}"
        documents.append(doc_text)
        metadatas.append({
            "name": company["name"],
            "industry": company["industry"],
        })
    
    try:
        await add_to_vector_store(COMPANIES_COLLECTION, ids, documents, metadatas)
        print(f"Successfully loaded {len(ids)} companies to vector store.")
    except Exception as e:
        print(f"Data ingestion failed: {e}")

if __name__ == "__main__":
    asyncio.run(load_companies())
