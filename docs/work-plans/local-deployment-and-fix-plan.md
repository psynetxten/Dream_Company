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
