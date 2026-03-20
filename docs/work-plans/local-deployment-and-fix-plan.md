# Project Roadmap & Work Plan

---

## 🚨 MISSION CONTROL (Claude Code: 여기부터 확인하세요)

> **CTO (Antigravity) 발행 날짜**: 2026-02-22
> Claude Code는 아래 태스크를 순서대로 실행하고, 완료 시 STATUS를 `COMPLETED`로 변경하세요.

---

### [ARCHIVED] TASK-001, 002, 003
- **STATUS**: COMPLETED (Locally Stabilized in Phases 1-5)
- **비고**: 로컬 개발 환경에서 모델 및 라우터 안정화 완료. SQLite 기반 E2E 검증 통과.

---

### TASK-004: Graduation - 프로덕션 배포 및 Cloud 동기화
- **STATUS**: PENDING
- **우선순위**: CRITICAL (Final Goal)
- **배경**: 로컬에서 검증된 모든 기능(Sponsor Matching, Payment, Writer Platform)을 실제 Supabase와 Vercel에 반영해야 함.
- **요구사항**:
  1. **Supabase Migration**: 로컬 SQLite의 최신 스키마를 Supabase PostgreSQL에 반영 (Alematic 또는 Manual SQL).
  2. **Environment Sync**: Vercel Dashboard의 Env에 `PORTONE_ID`, `GOOGLE_CLIENT_ID` 등 최신 변수 등록 확인.
  3. **Vercel Deployment**: `_version.txt`를 `v1.0.0`으로 업데이트하여 강제 재빌드 트리거.
  4. **Verification**: 
     - `https://dream-newspaper-phi.vercel.app/api/v1/health` 정상 작동 확인.
     - 실제 Supabase DB에 데이터가 저장되는지 확인.
- **검증 방법**: 운영 환경 접속 후 구글 로그인 및 의뢰 생성 시뮬레이션 성공.

---

*CTO 서명: Antigravity | 모든 핵심 Phase(1~5) 개발 완료. 졸업 단계 진입.*

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
