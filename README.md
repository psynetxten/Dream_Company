# 꿈신문사 (Dream Newspaper)

> 매일 아침, 당신의 꿈이 이루어진 미래를 신문으로 받아보세요.

AI 멀티에이전트 기반 꿈 신문 생성 서비스. 사용자가 되고 싶은 미래를 의뢰하면, Claude AI가 1인칭 현재진행형 미래 신문 형태로 매일 연재해 드립니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | Python 3.13 + FastAPI + uv |
| 프론트엔드 | Next.js 15 + TypeScript + Tailwind CSS |
| AI | Claude API (Anthropic) - claude-sonnet-4-5 + claude-haiku-4-5 |
| 메인 DB | PostgreSQL 16 |
| 벡터 DB | ChromaDB (스폰서 매칭) |
| 스케줄러 | APScheduler (매일 08:00 KST 자동 발행) |
| 인프라 | Docker Compose |

## 빠른 시작

### 1. 클론
```bash
git clone https://github.com/your-org/dream-newspaper.git
cd dream-newspaper
```

### 2. 환경변수 설정
```bash
cp .env.example .env
# .env 파일에서 필수 값 입력:
# ANTHROPIC_API_KEY=sk-ant-api03-...
# SECRET_KEY=your-32-char-minimum-secret-key
```

### 3. 실행
```bash
# Docker Compose로 전체 서비스 시작
make dev
# 또는
docker compose up --build
```

### 4. 접속
- **프론트엔드**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs
- **API 헬스체크**: http://localhost:8000/health

## 멀티에이전트 구조

```
OrchestratorAgent (claude-sonnet-4-5)
├── WriterAgent (claude-haiku-4-5)          # 신문 1편 생성
├── SponsorMatcherAgent (claude-haiku-4-5)  # 스폰서 자동 매칭
└── APScheduler                             # 매일 8시 자동 발행
```

## 서비스 흐름

1. 사용자가 꿈 의뢰 (이름, 목표 직업, 목표 회사, 기간)
2. OrchestratorAgent가 스폰서 매칭 + 발행 스케줄 생성
3. 매일 오전 8시 APScheduler가 WriterAgent 호출
4. WriterAgent가 미래 날짜 1인칭 현재진행형 신문 생성
5. 사용자가 웹앱에서 열람

## API 주요 엔드포인트

```
POST /api/v1/auth/register   # 회원가입
POST /api/v1/auth/login      # 로그인
POST /api/v1/orders          # 꿈 의뢰 생성
POST /api/v1/orders/{id}/start  # 의뢰 시작
GET  /api/v1/newspapers      # 내 신문 목록
GET  /api/v1/newspapers/{id} # 신문 상세
```

## 개발 명령어

```bash
make setup          # 최초 설정 (.env 복사)
make dev            # 전체 서비스 시작
make stop           # 서비스 중지
make clean          # 데이터 포함 완전 삭제
make migrate        # DB 마이그레이션
make test           # 테스트 실행
make logs           # 백엔드 로그
make load-companies # ChromaDB 기업 데이터 로드
```

## 비즈니스 모델

- **사용자 수익**: 구독(월정액) 또는 건당 결제 (7일/14일/30일)
- **스폰서 수익**: 기업이 변수 슬롯(회사명, 브랜드명) 구매
  - 사용자의 꿈 = 해당 기업의 잠재 지원자 풀
  - 스폰서 없으면 AI가 ChromaDB에서 자동 매칭

## 로드맵

- **Phase 1 (진행 중)**: AI 작가, 기본 로그인을 포함한 로컬 가동 및 검증
- **Phase 1.5 (추가)**: **24/7 자율 운영 인프라 구축** (Cloud Migration)
  - 노트북을 닫아도 AI가 스스로 작동하는 클라우드 환경 배포
- **Phase 2**: 스폰서 슬롯 구매, 결제 연동 (PortOne/Toss)
- **Phase 3**: 인간 작가 플랫폼, 작가 수익 배분
- **Phase 4**: 이메일 알림, 개인화 확장 (주변인 실명)
- **Phase 5**: 실제 신문사 연계, 물리적 신문 배송

## 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic 콘솔에서 발급 |
| `SECRET_KEY` | ✅ | JWT 서명 키 (32자 이상) |
| `DATABASE_URL` | ✅ | PostgreSQL 연결 URL |
| `CHROMA_HOST` | - | ChromaDB 호스트 (기본: localhost) |
| `ORCHESTRATOR_MODEL` | - | 오케스트레이터 모델 |
| `WRITER_MODEL` | - | 작성 에이전트 모델 |

전체 목록은 `.env.example` 참조.

## 라이선스

MIT
