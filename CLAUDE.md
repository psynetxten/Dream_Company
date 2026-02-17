# 꿈신문사 dream-newspaper - Claude 컨텍스트

상위 폴더의 CLAUDE.md 도 함께 참조할 것.

## 이 디렉토리 구조
```
dream-newspaper/
├── backend/          FastAPI 백엔드 (Python 3.13 + uv)
├── frontend/         Next.js 15 프론트엔드
├── docker/           Dockerfile들
├── .github/          GitHub Actions CI
├── docker-compose.yml
├── .env              환경변수 (Git 제외 - 절대 커밋 금지)
└── .env.example      환경변수 템플릿
```

## 자주 쓰는 명령어
```powershell
# 전체 실행
docker compose up --build

# 백엔드 로그만 보기
docker compose logs -f backend

# DB 마이그레이션
docker compose exec backend uv run alembic upgrade head

# 서비스 중지
docker compose down

# 데이터까지 완전 삭제
docker compose down -v
```

## API 엔드포인트 요약
```
POST /api/v1/auth/register      회원가입
POST /api/v1/auth/login         로그인 (JWT)
GET  /api/v1/auth/me            내 정보
POST /api/v1/orders             꿈 의뢰 생성
POST /api/v1/orders/{id}/start  의뢰 시작 (스케줄 생성)
GET  /api/v1/orders             내 의뢰 목록
GET  /api/v1/newspapers         내 신문 목록
GET  /api/v1/newspapers/{id}    신문 상세
```

## 에이전트 모델 설정 (.env)
```
ORCHESTRATOR_MODEL=claude-sonnet-4-5-20250929
WRITER_MODEL=claude-haiku-4-5-20251001
SPONSOR_MODEL=claude-haiku-4-5-20251001
```

## DB 테이블 목록
- users, orders, newspapers, sponsors, sponsor_slots
- writer_profiles, publication_schedules, agent_logs, notifications

## 신문 작성 규칙 (prompts.py 핵심)
- 날짜는 미래, 시점은 현재진행형
- "~할 것이다" 같은 미래형 금지
- 주인공 실명 3회 이상 자연스럽게 삽입
- 부정적 표현 금지
- JSON 형식으로 반환: headline, subhead, lead_paragraph, body_content, sidebar
