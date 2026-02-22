# Project Roadmap & Work Plan

---

## 🚨 MISSION CONTROL (Claude Code: 여기부터 확인하세요)

> **CTO (Antigravity) 발행 날짜**: 2026-02-22
> Claude Code는 아래 태스크를 순서대로 실행하고, 완료 시 STATUS를 `COMPLETED`로 변경하세요.

---

### TASK-001: 회원가입/로그인 에러 핸들링 강화
- **STATUS**: PENDING
- **우선순위**: CRITICAL
- **배경**: 현재 프로덕션에서 회원가입 버튼을 누르면 "가입 중..."에 무한 멈춤. UI에 에러가 전혀 표시되지 않음.
- **요구사항**:
  1. `frontend/src/app/(auth)/register/page.tsx` 수정
     - `authApi.register()` 호출에 `AbortController`를 사용한 **10초 타임아웃** 추가
     - 타임아웃 발생 시 "서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요." 에러 메시지 표시
     - 성공/실패 여부와 관계없이 `setLoading(false)` 보장 (`finally` 블록 확인)
     - **중요**: `authApi` (axios 기반)를 사용할 것. `fetch` 직접 사용 금지.
  2. `frontend/src/app/(auth)/login/page.tsx` 수정
     - 동일하게 10초 타임아웃 적용
     - 에러 메시지가 UI에 즉시 표시되는지 확인
  3. `frontend/src/lib/api.ts` 수정
     - axios 인스턴스에 `timeout: 10000` (10초) 옵션 추가
     - 이것만으로도 register/login 두 파일을 수정할 필요가 없을 수 있음 (한 곳에서 처리)
- **검증 방법**: 로컬에서 `npm run dev` 실행 후, 잘못된 백엔드 URL로 설정하고 가입 시도 → 10초 후 에러 메시지 표시되는지 확인

---

### TASK-002: Vercel 배포 파이프라인 연결 확인 및 수동 배포
- **STATUS**: PENDING
- **우선순위**: HIGH
- **배경**: GitHub `main` 브랜치에 여러 번 push했으나 Vercel이 이를 감지하지 못하고 있음. HTTP 헤더 `Age: 213831`(약 2.5일 전 빌드)가 여전히 서빙 중.
- **요구사항**:
  1. `vercel.json` 검토 — 현재 내용이 올바른지 확인:
     ```json
     {
       "version": 2,
       "builds": [
         { "src": "frontend/package.json", "use": "@vercel/next" },
         { "src": "backend/app/main.py", "use": "@vercel/python" }
       ],
       "rewrites": [
         { "source": "/api/v1/(.*)", "destination": "/backend/app/main.py" },
         { "source": "/api/(.*)", "destination": "/backend/app/main.py" },
         { "source": "/(.*)", "destination": "/frontend/$1" }
       ]
     }
     ```
  2. `frontend/public/` 디렉토리에 `_version.txt` 파일 생성:
     ```
     v0.2.0
     deployed: 2026-02-22
     ```
  3. 위 파일 생성 후 `git add . && git commit -m "chore: deployment sync check v0.2.0" && git push origin main` 실행
  4. **30초 후** `https://dream-newspaper-phi.vercel.app/_version.txt` 접근하여 위 내용이 보이는지 확인
  5. 만약 여전히 404라면: **Vercel Dashboard**의 해당 프로젝트 > **Settings > Git** 탭 확인 후 연결된 브랜치가 `main`인지 확인하고 결과를 이 파일에 기록할 것
- **검증 방법**: `https://dream-newspaper-phi.vercel.app/_version.txt` 에서 `v0.2.0` 텍스트 확인

---

### TASK-003: 백엔드 500 에러 원인 진단 및 수정
- **STATUS**: PENDING
- **우선순위**: HIGH
- **배경**: `https://dream-newspaper-phi.vercel.app/api/v1/health` 가 500 에러 반환.
- **요구사항**:
  1. `backend/app/main.py` 에 아래 간단한 헬스체크 엔드포인트 추가 (DB 연결 없이 순수 상태만 반환):
     ```python
     @app.get("/api/ping")
     async def ping():
         return {"status": "pong", "version": "0.2.0"}
     ```
  2. 배포 후 `https://dream-newspaper-phi.vercel.app/api/ping` 이 `{"status": "pong"}` 반환하는지 확인
  3. 만약 `/api/ping` 도 500 에러라면: Vercel의 Python Runtime 로그를 확인하고 에러 내용을 이 파일의 해당 TASK 아래에 기록
  4. 로그에서 발견된 에러를 수정 (주요 의심 원인: `asyncpg` 드라이버 import 실패, `pgvector` 미설치, DB URL 파싱 오류)
- **검증 방법**: `https://dream-newspaper-phi.vercel.app/api/ping` → `{"status": "pong", "version": "0.2.0"}` 반환 확인

---

*CTO 서명: Antigravity | 다음 CTO 보고는 모든 TASK가 COMPLETED 상태가 되면 자동 발행됩니다.*

---

# Project Roadmap & Work Plan (2026-02-17 Refined)

## Current Status
- **Environment**: Docker Desktop (Windows)
- **AI Context**: `AI_RULES.md` is active and synced across agents via `GEMINI.md` and `CLAUDE.md`.
- **Backend (Healthy)**: 
    - Database schemas and critical auth logic bugs have been fixed.
    - Local PostgreSQL and ChromaDB containers are operational.
- **Frontend (Unstable)**: 
    - Build is complete and standalone mode is active.
    - **Issue**: Container is currently in a "Restarting" loop. Under active investigation.

## Phase 1: Local Stability (Ongoing)
Goal: Achieve a fully functional local development environment.

1.  **Resolve Frontend Crash**:
    - [ ] Root cause analysis of `node server.js` failure.
    - [ ] Verify environment variable propagation from `docker-compose.yml` to the container.
    - [ ] Confirm build artifacts in `/app/.next/standalone` are correctly structure.
2.  **End-to-End Verification**:
    - [ ] Verify Frontend can successfully query Backend `/api/v1/health`.
    - [ ] Test auth flow (Register/Login) with local Postgres.
    - [ ] Test AI Newspaper generation with actual Anthropic API key.

## Phase 2: Supabase Migration (Planned)
Goal: Shift infrastructure to managed services for scalability and ease of deployment.

1.  **Database Migration**:
    - Move from local PostgreSQL to Supabase DB.
    - Update `DATABASE_URL` in `.env`.
2.  **Auth Integration**:
    - Evaluate replacing custom FastAPI JWT logic with Supabase Auth (GoTrue).
3.  **Vector Store Consolidation**:
    - Explore replacing ChromaDB with Supabase `pgvector` to reduce infrastructure overhead.

## Phase 3: Feature Enhancement
1.  **Human Writer Platform**: Implement the writer role and submission flow.
2.  **Sponsor Matching**: Refine the SponsorMatcherAgent logic using the consolidated Vector store.

---
*Maintained by AI Agents (Antigravity & Claude Code)*
