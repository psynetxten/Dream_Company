# 꿈신문사 CEO ↔ CTO 소통 파일

---

## 🗓️ 회의록 (2026-06-26) — 작가·스폰서 유입 개선 전 직원 회의

**참석:** PM / UX 리서처 / 그로스 / 프론트엔드 (CTO 주재·종합)
**의제:** 작가·스폰서가 "들어오는 과정"을 더 쉽게 손보기 + 코드 정리

### CTO 코드 분석으로 확인된 현황(사실)
- **작가:** `/register/writer` 존재하나 구식 email+password + 신문 브루탈리즘 디자인. 폼이 필명/전문분야/자기소개를 받지만 **백엔드로 전송 안 됨 → 버려짐**(`registerAndLogin`은 email/password/name/role만 보냄). 백엔드 `writer.py`에 작가 프로필 생성 엔드포인트 **없음**. 게스트 랜딩에 작가 지원 **발견 경로 없음**.
- **스폰서:** 등록 페이지 **2개 중복** — `/register/sponsor`(계정+role만 생성 → 등록 후 `/sponsor/me` 404) + `/sponsor/register`(프로필 생성). 둘 다 구식 디자인. 슬롯 "구매" 무료(결제 미연동).
- **보안(검증완료):** `/auth/register`·`PATCH /auth/me`가 클라이언트 `role`을 `{user,writer,sponsor}` 범위에서 그대로 수용 → **누구나 심사 없이 작가/스폰서 권한 자가획득 가능**(admin 상승은 불가). 작가가 되면 무료 주문 가로채기 가능.
- **공통:** 디자인 이중화(유저=모바일앱 / 작가·스폰서=데스크탑신문), 인증 이중화(Magic Link vs password), role 단방향·단일(겸직 불가).
- **브랜드규칙 위반:** 스폰서 페이지에 "AI" 노출(`/register/sponsor`, `/sponsor/register`) → "편집국" 표현으로 교체 필요.

### 4부서 합의 (수렴)
- **P0-1 [보안]** register/PATCH me에서 클라이언트 role 신뢰 제거 → role은 서버가 결정. *(한 줄 수준, 최우선)*
- **P0-2 [데이터유실]** 작가 프로필 생성 엔드포인트 신설 + 폼 데이터 백엔드 연결. *(이미 입력받은 데이터가 매일 버려짐)*
- **P0-3 [중복/404]** 스폰서 등록 페이지 2개 → 1개 통합.
- **P1 [인증통일]** 작가·스폰서도 Magic Link. 가입(이메일만) ↔ 프로필 수집(가입후 온보딩 스텝) 분리.
- **P1 [멀티role]** 단방향 전환 폐기 → 한 계정이 독자+작가+스폰서 겸직. *(PM 강력 권고: 비즈니스 모델 정합 — 꿈꾸는 스폰서 담당자가 최고 타깃)*
- **P1 [디자인통합]** `app-*` 유틸 + 공용 컴포넌트(`StepForm`/`TagInput`/`AuthShell`/`RoleSwitcher`)로 작가·스폰서를 모바일앱 스타일에 흡수.
- **P1 [발견경로]** 랜딩에 공급측 CTA 2종("기자단 합류"/"우리 브랜드를 미래에") + 작가/스폰서 waitlist. *(그로스 최고 ROI 실험)*
- **P2 [first value]** 가입 직후 미리보기("N명이 당신 분야를 꿈꿉니다" / 작가 대기 의뢰 카드).
- **P2 [수익화]** 슬롯 결제 연동 (케이스스터디 확보 후).

### CTO 권장 실행 순서
1. **P0 3건 즉시**(저위험·고가치): 보안 role 제거 → 작가 데이터 복구 → 스폰서 등록 통합 + "AI" 카피 수정.
2. **P1 본격 개편**(중간 규모, CEO 승인 후): 멀티role 모델 + Magic Link 통일 + 디자인 시스템 통합 + 랜딩 CTA·waitlist.
3. **P2 나중**: first value 미리보기, 결제.

### ✅ CEO 결정 (2026-06-26)
- **(A) role 모델**: 멀티-role 겸직 채택.
- **(B) 착수 범위**: P0 + P1 본격 개편.

### 진행 현황
**✅ 완료 — P0-3/P0-4 스폰서 온보딩 수정 (프론트+미들웨어, 백엔드 무관, 검증완료)**
- 검증 중 **스폰서 가입이 다중으로 깨져 있던 것** 발견·수정:
  1. `/sponsor/register`가 미들웨어 ROLE_GUARD("/sponsor"=sponsor 전용)에 막혀 일반 유저가 접근 불가(홈으로 튕김) → 가입 불가능 상태였음.
  2. 등록 성공 후 role 쿠키 미갱신 → 대시보드로 또 튕김.
  3. 등록 페이지 2개 중복(`/register/sponsor` 비보안 registerAndLogin + `/sponsor/register`).
  4. "AI 타겟팅" 카피(브랜드 규칙 위반).
- 수정:
  - `middleware.ts`: `ROLE_GUARD_EXEMPT=["/sponsor/register","/writer/apply"]` 추가 — 가입/온보딩 경로는 인증만 되면 역할 무관 접근. (다른 /sponsor/* 는 여전히 보호 — 검증함)
  - `/sponsor/register`: 등록 성공 시 `setRoleCookie("sponsor")` + "AI 타겟팅"→"타겟팅 설정", "AI가 매칭"→"편집국이 맞춤 연결".
  - `/register/sponsor`(비보안): `/sponsor/register`로 리다이렉트 처리(client-role 전송 경로 폐기).
  - 랜딩 `page.tsx` 스폰서 등록 링크 → `/sponsor/register`.
- 검증(로컬 dev): role=user로 /sponsor/register 접근 가능·새 카피 확인, /register/sponsor 리다이렉트 확인, /sponsor/dashboard는 여전히 차단, 콘솔 에러 0.

**✅ 완료 — P0-1/P0-2 백엔드 보안 + 작가 온보딩 (Docker로 로컬 검증 완료)**
- **P0-1 보안**: `auth.py` register는 항상 role="user"(클라이언트 role 무시), `PATCH /auth/me`에서 role 자가지정 제거.
  - 검증(로컬 Docker): register에 role="admin" 주입 → 응답 role "user" ✅
- **P0-2 작가 지원**: `POST /writer/apply` 신설 — 인증만 요구, 필명/전문분야/bio 저장 + role 서버 승격(WriterProfile에 필드 이미 존재 → 마이그레이션 불필요).
  - 검증(로컬 Docker, 실DB): 가입(user)→로그인→apply→role "writer" 승격 + /writer/me에 pen_name/specialties 영속 확인 ✅ (이전엔 버려지던 데이터)
  - 무인증 apply → 401 ✅
- **프론트 작가 온보딩**:
  - 신규 `/writer/apply` 페이지 — Magic Link 인증 후 필명/전문분야/자기소개 입력 → writerApi.apply → setRoleCookie("writer") → 대시보드. **모바일 앱 스타일(app-*)로 작성 — P1 디자인 통합 일부 달성.**
  - `/register/writer`(구식 password) → `/writer/apply`로 리다이렉트.
  - `lib/api.ts`에 `writerApi.apply` 추가.
  - **next 보존**: `/auth/callback`이 `next` 파라미터 존중 + 로그인 Magic Link가 callback에 next 전달 → 콜드 게스트가 작가/스폰서 온보딩으로 진입해도 Magic Link 왕복 후 의도 유지(스폰서도 함께 이득).
  - 검증(로컬 dev): /register/writer→/writer/apply→(미인증)→/login?next=/writer/apply ✅, 세션 주입 시 /writer/apply 폼 정상 렌더(필명+전문분야 칩8+합류 버튼) ✅, 콘솔 에러 0.
- ✅ **배포·프로덕션 검증 완료**: 백엔드(Render 자동배포, ~150초) + 프론트(Vercel). 프로덕션 E2E 스모크: register role=admin 주입→user 강제 ✅, 가입→로그인→apply→role writer 승격+프로필 영속 ✅. 프론트 라우팅(/writer/apply 가드/next) 라이브 확인 ✅.

### 📋 발견 이슈 — 하단 탭바 (MobileBottomNav, CEO 질문 계기)
역할별 탭 구성이 제각각이고 "의뢰 가운데 버튼"이 일관적이지 않음:
- 로그인 유저: 홈 | **의뢰(가운데 플로팅)** | 마이페이지 ← 정상
- 작가: 집무실 | 템플릿 | 홈 ← 가운데 액션버튼 없음
- 스폰서: 대시보드 | 슬롯 | 홈 ← 가운데 액션버튼 없음
- 게스트: 홈 | 로그인 | "시작하기"(플로팅) ← **버그**
- **버그1**: 게스트 플로팅 버튼 라벨이 `의뢰`로 하드코딩(MobileBottomNav.tsx:216) — 실제 탭은 "시작하기"인데 화면엔 "의뢰".
- **버그2**: 게스트 "시작하기"→`/register`→`/` 리다이렉트만 됨(의뢰/온보딩으로 안 이어짐).
- **레이아웃**: `center:true`는 위치가 아니라 스타일만 바꿈 → 게스트는 플로팅이 가운데 아닌 오른쪽에 옴.
- ✅ **수정 완료** (CEO "알아서 정리" 지시): 가운데 버튼 라벨 하드코딩 제거(`tab.label` 사용), 게스트 탭바를 `홈 | 시작하기(가운데 플로팅, /) | 로그인`으로 재배치(죽은 `/register` 링크 제거, 플로팅 진짜 가운데로), React key를 고유한 `tab.label`로 변경. 작가·스폰서는 현행 3탭 유지. 검증(로컬 dev): 게스트 nav 라벨·위치·링크 정상, 콘솔 key 에러 없음.

**🔄 진행 중 — P1** (CEO "진행해줘" 지시):
- ✅ **랜딩 공급측 CTA**: TypingLanding 하단에 "기자단 지원 · 스폰서 문의" discreet 링크 추가 → /writer/apply, /sponsor/register. (이전엔 공개 사이트에 공급측 발견 경로 전무) — 배포·검증 완료.
- ✅ **스폰서 등록 페이지 디자인 통합**: 구식 브루탈리즘 → 모바일 앱 스타일(app-*, F4F3EE, max-w-md, 둥근 입력/태그칩, 하단 네비) 재작성. 세션 가드 추가(미로그인→/login?next 보존). 기능(필드·태그·register·setRoleCookie) 전부 보존. — 검증 완료(세션 주입 렌더, 콘솔 0), 배포 진행.
  - 이로써 작가(/writer/apply)·스폰서(/sponsor/register) 온보딩 모두 유저 플로우와 동일 디자인 언어로 통일됨.
- ✅ **멀티-role DB 모델 (겸직)** — Docker E2E 검증 완료:
  - DB: `users.roles` 배열 컬럼 추가(마이그레이션 `d4e5f6a7b8c9`), 기존 유저 `[role]`로 backfill. `users.role`은 활성(active) role로 유지(라우팅 기계 무변경 = 저위험).
  - 백엔드: `require_role`이 보유 집합(roles) 기준 판정 / 작가·스폰서 지원이 역할을 덮어쓰지 않고 **추가** + 활성 전환 / 신규 `PATCH /auth/active-role`(보유 역할로만 전환, 미보유 403) / `/auth/me`에 roles 포함 / register는 roles=["user"].
  - 프론트: `authApi.setActiveRole`, 프로필 페이지에 역할 전환 스위처(2개 이상 보유 시 표시), 작가/스폰서 nav "홈"→"더보기"(/profile)로 변경(프로필·로그아웃·역할전환 접근 + 기존 로그아웃 부재 갭 해소).
  - Docker E2E: 가입→작가→스폰서 누적(roles=[user,writer,sponsor]) / 활성=sponsor인데 writer 보유 시 /writer/me 200 / 활성전환 / 미보유 admin 403 — 전부 통과.
  - 🚨 **배포 시 인시던트 발생·복구**: Render DB에 마이그레이션이 적용 안 돼(`column users.roles does not exist`) **프로덕션 인증 전체 장애**(register 400, /auth/me 500). 원인: Dockerfile이 `alembic upgrade head; uvicorn`(실패해도 기동)인데 Render alembic 체인이 어긋나 마이그레이션 미적용. **즉시 백엔드를 직전(b87d2c6)으로 롤백→복구 확인**(/auth/me 200, 작가지원 정상). 멀티-role 코드는 git e87d9c7에 보존.
  - 프론트(스위처/nav)는 유지 — roles 부재 시 스위처 자동 숨김이라 무해. 작가/스폰서 nav "더보기"(/profile)도 정상.
  - 교훈 메모리화: [Render 마이그레이션 위험](../../../../.claude/.../project_render_migration_risk.md).
  - ✅ **멀티-role 재적용·배포 완료 (인시던트 해결)**: 백엔드 DB가 **Supabase Postgres**(`qzlcpfrhwjgjafdafrva`)임을 발견 → Supabase MCP로 `users.roles` 컬럼을 프로덕션 DB에 직접 선적용(+backfill) → 멀티-role 코드 재배포 → **프로덕션 E2E 전부 통과**(가입 `[user]`→작가 `[user,writer]`→스폰서 `[user,writer,sponsor]` 3겸직, /auth/me 200, 활성전환, 미보유 admin 403). alembic 마이그레이션은 멱등(IF NOT EXISTS)으로 변경. Render alembic 의존 제거.
  - 교훈: Render 백엔드 DB = Supabase Postgres이므로 **앞으로 스키마 변경은 Supabase MCP로 직접 적용**하면 안전(Render alembic 우회).

### ✅ 보안 해결 (2026-06-26) — RLS 활성화로 유저 데이터 노출 차단
- CEO 승인 후 16개 public 테이블 전부 `ENABLE ROW LEVEL SECURITY` 적용(Supabase MCP).
- 사전 확인: 프론트·백엔드 모두 anon 키 PostgREST로 테이블 직접 접근 안 함(`.from()`/`.table()` 미사용), 백엔드는 DATABASE_URL 직접연결(RLS 우회) → RLS 켜도 앱 무영향.
- 검증: anon 키로 users/orders 조회 → 이제 **빈 배열**(차단됨, 이전엔 실제 이메일 반환). 앱 인증 회귀: 가입/로그인/`/auth/me` 200/작가지원 success/공개 신문 피드 200 — 전부 정상.
- 참고: 정책(policy)은 추가 안 함(anon 직접 접근을 의도적으로 전면 차단; 데이터는 백엔드 경유만). 추후 프론트에서 anon 직접 읽기가 필요해지면 그때 정책 설계.

<details><summary>이력: 발견 당시 기록 (RLS 비활성, 전체 유저 데이터 노출)</summary>
- Supabase의 모든 16개 public 테이블에 **RLS(Row Level Security) 비활성** → 공개 anon 키로 전 테이블 읽기/쓰기 가능.
- **실측 확인**: 공개 anon 키로 `GET /rest/v1/users?select=id,email` → 실제 유저 이메일 반환(HTTP 200). anon 키는 프론트 번들·render.yaml에 공개돼 있어 **누구나 전체 유저 이메일 열람 + 모든 테이블 수정 가능**.
- 영향: users(이메일), orders, newspapers, sponsors 등 전부.
- 백엔드는 DATABASE_URL 직접 연결(postgres role)이라 RLS 켜도 **앱은 정상 동작 추정**(RLS는 anon/authenticated PostgREST 접근만 차단). 단 보안 설정 변경이라 CTO가 임의 적용 안 함 — **CEO 결정 필요**.
- 권장: `ALTER TABLE public.<each> ENABLE ROW LEVEL SECURITY;` (16개 테이블). 백엔드 직접연결은 영향 없음. 적용 후 프론트/백엔드 회귀 확인.
</details>
- ⏳ **남은 P1(선택)**: Magic Link 인증 완전 통일, 공용 컴포넌트 추출, waitlist, first-value 미리보기.

---

## ✅ 완료 (2026-06-26) — 의뢰 폼 데스크탑 모바일 폭 고정 + 배포

### 문제
- CEO 피드백: "의뢰할 때 화면이 갑자기 웹(전체 폭)이 됨 — 모바일 사이즈여야 함"
- 원인: `OrderForm`의 `Screen` 래퍼(`position:fixed; inset:0`)에 `max-width` 제한 없음
  → 데스크탑에서 폼이 화면 전체 폭으로 퍼짐 (로그인/랜딩은 `max-w-sm`로 제한하는데 OrderForm만 누락)

### 수정
- `Screen` 안에 `width:100%; maxWidth:430px` 중앙 정렬 래퍼 추가 (Step 1/2/3 공통 적용)
- 파일: `frontend/src/components/forms/OrderForm.tsx`

### 검증
- 로컬 dev: 1280px → 래퍼 430px 중앙정렬(left=425), 375px → full-width(375px), 콘솔 에러 0
- 프로덕션: dreamnewspaper.com SSR HTML에 `max-width:430px` 포함 확인 ✅

### 배포
- 커밋 `81a0b05` → `psynetxten/Dream_Company` main 푸시
- ⚠️ **주의**: Vercel은 `psynetxten` git push로 자동 배포 안 됨 (구 repo `powergild/DreamNews`에 연결)
  → `frontend/` 디렉토리에서 `vercel deploy --prod`로 **수동 배포** 필요
  → 루트에서 배포하면 루트 `vercel.json`의 `@backend_url` 시크릿 미존재로 실패함
- 배포: `dpl_EyKtug1uzRyiWpQSPhhNJZR8dP1x` → **READY** → dreamnewspaper.com 별칭 연결 ✅

---

## ✅ 완료 (2026-06-21) — 전체 E2E 플로우 테스트 완료 (게스트→로그인→주문→신문뷰어)

### E2E 전체 플로우 PASS (dreamnewspaper.com 실 브라우저)

| 단계 | 결과 |
|------|------|
| Magic Link 클릭 → `/auth/callback` → `/dashboard` 리다이렉트 | ✅ |
| `/dashboard` 빈 상태 렌더링 | ✅ |
| `/order/new` Step 1: 꿈 입력 | ✅ |
| `/order/new` Step 2: 주인공·역할·회사·연도 입력 | ✅ |
| `/order/new` Step 3: 무료 시작 → 주문 생성 | ✅ |
| `/order/generating` LIVE 스트리밍 로그 | ✅ |
| `/newspapers/{id}` 신문 뷰어 완전 렌더링 | ✅ |
| 스폰서 자동 매칭 (AI 꿈 → GOOGLE) | ✅ |
| 미래 날짜 (2030년), 1인칭 현재진행형 문체 | ✅ |

**생성된 신문**: `b799f876-ad99-4050-a81b-fdf2cbd48320`
**헤드라인**: "이준호, 카카오 AI팀 수석 엔지니어 등극"
**스폰서**: GOOGLE (자동 매칭)

---

## ✅ 완료 (2026-06-21) — 인증 플로우 E2E 테스트 + 버그 수정 4건

### 발견 및 수정한 버그

| # | 버그 | 수정 내용 |
|---|------|----------|
| 1 | `/login` "시작하기" → `/register` → `/login` 무한루프 | "꿈신문 받기 →" 링크 → `/` (TypingLanding)으로 변경 |
| 2 | `/` 게스트 방문 시 `/login`으로 리다이렉트 | `api.ts` 401 인터셉터 → 보호 경로에서만 리다이렉트 (공개 페이지 제외) |
| 3 | `/login` 이메일+비밀번호 폼 — Magic Link 가입자 로그인 불가 | Magic Link OTP 폼으로 완전 교체 |
| 4 | `GuestOnboarding` 데드코드 — `/register` 링크 포함 | 컴포넌트 제거 |

### E2E 테스트 검증 결과 (dreamnewspaper.com 직접 브라우저 테스트)

| 단계 | 결과 |
|------|------|
| `/` 게스트 → TypingLanding 표시 (리다이렉트 없음) | ✅ |
| 이름 입력 → Enter → suffix 타이핑 애니메이션 | ✅ |
| 이메일 입력 → "꿈신문 받기" → Magic Link 발송 | ✅ |
| `/login` Magic Link OTP 폼 | ✅ |
| `/login` "꿈신문 받기 →" → `/` (루프 없음) | ✅ |
| TypingLanding "이미 구독 중이에요 →" → `/login` | ✅ |

### 배포
- 커밋: `ad53a71` → `psynetxten/Dream_Company` main
- Vercel 배포: `dpl_HQ9wEESmYS6eZHexT6zCnMTfRn7u` → **READY** ✅
- dreamnewspaper.com 실시간 반영 완료

### 다음 할 일
- Magic Link 클릭 → `/auth/callback` → 대시보드 이동 검증 (CEO가 받은 이메일 링크 클릭으로 확인 가능)
- `/order/new` 의뢰 생성 → 신문 뷰어 플로우 추가 테스트
- RESEND_API_KEY Render 환경변수 추가 → 커스텀 이메일 발신자명 설정

---

## ✅ 완료 (2026-06-14) — 로그인 플로우 수정 + /auth/me 503 근본 원인 수정

### 진단 결과
- **무한반복 원인**: Render 콜드 스타트 중 OPTIONS preflight → 503 → CORS 오류 → "Failed to fetch" → 로그인 페이지 탈출 불가
- **수정 1**: 로그인 페이지 로드 시 `/api/ping` warmup fetch (OPTIONS 없이 GET이라 CORS 프리플라이트 불필요)
- **수정 2**: FastAPI 422 에러 상세(배열)를 `[object Object]`로 보여주던 버그 수정
- **수정 3 (오늘 신규)**: `/auth/me` GET이 항상 503 반환하는 버그 수정
  - **근본원인**: `supabase.auth.get_user()` = 동기 HTTP 호출이 async 이벤트루프를 블로킹 → Render 타임아웃 → 503
  - **수정**: `python-jose`로 JWT 로컬 검증 (네트워크 호출 없음, 수 밀리초)
  - **배포**: `psynetxten/Dream_Company` main 브랜치 푸시 → Render 자동 배포 진행 중

### 🚨 CEO 필수 액션 1개 (오늘)
> **Render 환경변수 `SUPABASE_JWT_SECRET` 추가 필요** — 이거 없으면 수정 3이 적용 안 됨 (폴백 코드로 동작)
>
> **방법**:
> 1. Supabase 대시보드 → Settings → API → **JWT Settings** → **JWT Secret** 복사
> 2. Render 대시보드 → `dream-newspaper-backend` → **Environment** → `SUPABASE_JWT_SECRET` = 복사한 값 → **Save Changes**
> 3. 서비스 자동 재시작됨 → `/auth/me` 200 반환 확인

### 테스트 결과 (오늘 직접 확인)
- 로그인 POST `/api/v1/auth/login` → **200** ✅
- 리다이렉트 `/` → **성공** ✅  
- `dream_role=user` 쿠키 설정 → **성공** ✅
- `/dashboard` 보호 라우트 접근 → **성공** ✅ (내 꿈 시리즈 빈 상태 정상 표시)
- `/auth/me` GET → **503** ⚠️ (위 환경변수 추가하면 200으로 바뀜)
  - 현재: `getUserRole()` try/catch → "user" 기본값 반환 → 일반 유저 로그인은 정상 작동
  - 작가/스폰서 계정은 환경변수 추가 후 올바른 대시보드로 이동됨

---

## ✅ 완료 (2026-06-14) — Vercel 프로덕션 배포 완료

### 🌐 라이브 URL
| 서비스 | URL | 상태 |
|--------|-----|------|
| **Vercel 프론트엔드** | https://dream-newspaper-phi.vercel.app | ✅ LIVE |
| 백엔드 API | http://localhost:3003 (로컬만) | 🔧 Railway 배포 필요 |

**배포 내용**: TypingLanding + Magic Link 온보딩 + `/auth/callback` + `/onboarding` + 통계 API
- 30개 페이지 빌드 성공, 컴파일 오류 없음
- `vercel.json` 수정: `rootDirectory` 제거, 시크릿 참조 제거 (env 섹션 삭제)
- Vercel CLI (`vercel deploy --prod`) 로 직접 배포 (GitHub 연결 우회)

### CEO 대기 중인 항목
| 순서 | 작업 | 상태 |
|------|------|------|
| 1 | Railway 가입 + 백엔드 배포 | ⬜ 대기 |
| 2 | 배포 후 Vercel env 업데이트: `NEXT_PUBLIC_API_URL` = Railway URL | ⬜ 배포 후 CTO가 처리 |
| 3 | Supabase Magic Link 이메일 커스터마이징 (RESEND_API_KEY 필요) | ⬜ 선택사항 |

### CTO 완료 (2026-05-29~31)
- ✅ AI 엔진: Claude CLI → Anthropic Python SDK 직접 호출 전환
- ✅ 전 에이전트 Claude Haiku 4.5로 통일 (비용 최적화)
- ✅ Docker: Node.js + Claude CLI 제거 → 이미지 400MB 경량화
- ✅ Android 빌드 가이드 작성 (`docs/work-plans/android-build.md`)
- ✅ iOS 빌드 가이드 작성 (`docs/work-plans/ios-build.md`)
- ✅ **TypingLanding 컴포넌트 구현** — 이름 입력 → 타이핑 애니메이션 → 이메일 → 매직링크 발송
- ✅ **`/auth/callback` 라우트** — 매직링크 클릭 후 주문 유무 체크 → 신규: `/onboarding`, 기존: `/`
- ✅ **`/onboarding` 페이지 전면 재설계** — "EXCLUSIVE INVITATION" + 실제 통계 카드 (26명, 28편, 2기업) + 꿈 입력 → 주문 자동 생성 → 홈
- ✅ **`/api/v1/stats` 엔드포인트** — 백엔드 신규 구현, 실 데이터 반환 확인
- ✅ **UserHome 통계 카드** — "지금 꿈신문사에서는" 3열 그리드 (같은 꿈꾸는 사람 / 발행된 신문 / 파트너 기업)
- ✅ **API URL 버그 수정** — `NEXT_PUBLIC_BACKEND_URL`(없는 변수) → `getApiBaseUrl()` (3003포트 자동감지) 3개 파일 수정
- ✅ **Docker 프론트엔드 리빌드 완료** — 신규 코드 배포, 전체 페이지 HTTP 200 확인
  - `/` → TypingLanding (게스트), UserHome (로그인)
  - `/auth/callback` → 로그인 중... (매직링크 처리)
  - `/onboarding` → "EXCLUSIVE INVITATION" + 통계 + 꿈 입력 → 주문 생성

### 전체 회의 운영 중
- 매일 09:00 정기 전체 회의 → `docs/work-plans/meetings/` 폴더에 회의록 누적
- 5/29 1차 회의: 브랜딩/마케팅 전략 수립
- 5/30 2차 회의: 론칭 준비 가속화, 소프트 론칭 6/15 확정 예정

### 주요 결정 사항 (2026-05-29~30)
- 브랜드 포지셔닝: "꿈신문사는 당신이 살고 싶은 미래를 오늘의 신문으로 배달합니다."
- 히어로 카피: "10년 후 당신이 살고 있을 하루, 지금 받아보세요."
- 소셜 바이오: "2035년 당신의 일상이 궁금하세요? 꿈신문사 기자단이 씁니다"
- 브랜드 컬러: 네이비 #1A2744 / 골드 #C9A84C / 크림 #F7F4EE
- "AI" 표현 전면 금지 정책 확정
- 신문 공유 이미지 자동 생성: Phase 2로 이관

### CEO 결정 필요 이슈 (🔴 긴급순)
| # | 이슈 | 기한 |
|---|------|------|
| 🔴 1 | **Anthropic 크레딧 충전** — 미충전 시 AI 생성 전체 중단 | 오늘 오전 |
| 🔴 2 | **파운딩 스폰서 가격 승인** — 얼리버드 50만→정가 100만 구조 | 오늘 오전 |
| 🟡 3 | 도메인 결정 (.kr 권장, 오늘 배포는 Vercel URL로 진행) | 6/10 전 |
| 🟡 4 | 결제 수단: 토스페이먼츠 1순위 확인 (6/30 유료 전환 시 필요) | 6/20 전 |

### 소프트 론칭 공식 확정 (2026-05-31 전원 합의)
> **2026년 6월 15일 (월) 소프트 론칭**  
> 6/1~6/14: 예열 콘텐츠 + 체험단 20명 모집  
> 6/15: 체험단 서비스 오픈  
> 6/30: 정식 론칭 + 유료 결제 전환

---

## 최근 완료 작업 (2026-04-05) — 앱 디자인 전면 전환

### [x] COMPLETED — "웹사이트 → 앱으로" 전면 재설계
**목표**: 앱처럼이 아니라 진짜 앱으로. 1000만 다운로드 목표.

**완료 내용**:

1. **앱 셸 컴포넌트 신규 생성**
   - `AppBar.tsx` — 고정 상단 바 (뒤로가기 / 타이틀 / 우측 액션)
   - `MobileBottomNav.tsx` — 역할별 하단 탭바 (user/writer/sponsor/guest)
   - `globals.css` — 앱 디자인 시스템 (app-card, app-btn, app-input, badge, skeleton 등)
   - `tailwind.config.ts` — app.* 색상 토큰 추가

2. **홈 화면 전면 재설계** (`page.tsx`)
   - guest → 3단계 스와이프 캐러셀 온보딩 (다음/건너뛰기/사회적 증거)
   - user → 연재 중 시리즈 + 꿈 피드 (카드 기반)
   - writer → 배정된 의뢰 + 수락 대기 집무실
   - sponsor → 현황 숫자 그리드 + 온보딩 단계

3. **꿈 의뢰 폼 앱 마법사로 전환** (`OrderForm.tsx`)
   - 신문 웹폼 → 3단계 앱 마법사
   - 1단계: 꿈 입력 (textarea, 글자 수 표시)
   - 2단계: 주인공/역할/회사/연도 칩 선택
   - 3단계: 플랜 카드 선택 (무료/프리미엄)
   - 진행 바 애니메이션 + 유효성 검사

4. **대시보드 앱 스타일** (`dashboard/page.tsx`)
   - 스켈레톤 로딩, 진행률 바, D-N 카운트다운, 상태 뱃지

5. **신문 리더 개선** (`newspapers/[orderId]/page.tsx`)
   - 에피소드 칩 가로 스크롤 선택기
   - 공유 버튼 (navigator.share / 클립보드 복사)
   - 스켈레톤 로딩

6. **로그인/회원가입 앱 스타일** (`login/page.tsx`, `register/page.tsx`)
   - 카카오/구글 소셜 로그인
   - 앱 인풋 스타일, 터치 타겟 최소 44px

7. **CSS 유틸리티** (`globals.css`)
   - `.scrollbar-hide` — 에피소드 칩 가로 스크롤
   - `.app-card-tap` — 탭 스케일 피드백

---

## 최근 완료 작업 (2026-04-10) — 전체 사이트 테스트 및 버그 수정

### [x] COMPLETED — 전체 플로우 E2E 테스트 + 버그 수정
1. **로딩 속도 개선**: `getUser()` → `getSession()` + localStorage 역할 캐시 → 0ms 로딩
2. **바텀 내비 3탭으로 축소**: 홈 / 의뢰(FAB 중앙) / 마이페이지
3. **의뢰 FAB 중앙 배치**: 홀수 탭(3개)으로 정확히 중앙에 위치
4. **스플래시 로딩 화면**: 🗞️ 바운스 + 빨간 점 애니메이션
5. **로그인 화면 핏**: h-dvh overflow-hidden으로 스크롤 없이 화면 맞춤
6. **프로필(/profile) 페이지 신규**: 유저 정보, 문의/약관 메뉴, 로그아웃
7. **리다이렉트 통일**: 로그인 후 `/dashboard` → `/` (홈 피드) 로 통일
   - auth.ts roleToHome(), login/page.tsx 소셜 로그인, middleware.ts 모두 수정
8. **테스트 계정**: test@dream.com / dream1234

**전체 플로우 검증 완료**:
- 게스트 온보딩 3슬라이드 ✅
- 로그인 ✅
- 홈 피드 (스트릭, 연재 시리즈, 꿈 피드) ✅
- 의뢰 3단계 위저드 ✅
- 의뢰 성공 페이지 + 카카오 공유 ✅
- 신문 뷰어 ✅
- 프로필/로그아웃 ✅

---

## 최근 완료 작업 (2026-04-11) — 앱스토어 출시 준비 완료

### [x] COMPLETED — Android + iOS 앱스토어 전체 준비

**완료 내용**:

1. **백엔드 테스트 전부 통과** (44/44)
   - pytest-asyncio 세션 루프 설정 수정 (pyproject.toml)
   - register 응답 형식 맞춤 (UserResponse, 토큰 없음)
   - conftest.py: register → login 2단계로 수정

2. **Capacitor 네이티브 앱 설정**
   - `capacitor.config.ts`: `server.url = "https://app.dreamnewspaper.com"` (WebView 방식)
   - `next.config.ts`: BUILD_MODE=export(앱) vs standalone(웹) 분기
   - `package.json`: cross-env + build:app / build:web / cap:build:android 스크립트

3. **앱 아이콘 + 스플래시 스크린**
   - `frontend/public/splash.svg`: 꿈신문사 브랜드 2732×2732
   - `frontend/generate-assets.mjs`: SVG → 전 사이즈 자동 생성 스크립트
     - Android: mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi (ic_launcher, round, foreground)
     - iOS: AppIcon.appiconset (20px~1024px) + Contents.json
     - Web: favicon, apple-touch-icon, 72~512px icons

4. **Android 네이티브 프로젝트** (`frontend/android/`)
   - `app/build.gradle`: versionCode 1, versionName 1.0.0, 서명 설정
   - `AndroidManifest.xml`: 권한 (INTERNET/POST_NOTIFICATIONS/VIBRATE), 딥링크
   - `CREATE_KEYSTORE.md`: Android Studio JDK keytool 사용법

5. **iOS 네이티브 프로젝트** (`frontend/ios/`)
   - `Info.plist`: 한국어, 카메라/앨범 권한, ATS(HTTPS only), 딥링크, 카카오 스킴

6. **개인정보처리방침/이용약관 페이지**
   - `frontend/src/app/privacy/page.tsx` — 앱스토어 심사 필수
   - `frontend/src/app/terms/page.tsx`

7. **스토어 리스팅 문서** (`docs/store-listings/`)
   - `play-store.md`: 앱 이름, 설명(80자/4000자), 스크린샷 스펙
   - `app-store.md`: 앱 이름, 부제목, 키워드, 심사자 테스트 계정
   - `RELEASE_GUIDE.md`: Railway + Vercel + Android + iOS 단계별 출시 가이드

---

**CEO가 직접 해야 하는 것** (CTO 대신 불가):

| 순서 | 작업 | 필요 사항 |
|------|------|----------|
| 1 | Railway 가입 + 백엔드 배포 | GitHub 계정 |
| 2 | Vercel 가입 + 프론트엔드 배포 | GitHub 계정 |
| 3 | `capacitor.config.ts` PRODUCTION_URL 실제 URL로 업데이트 | 배포 후 URL 확인 |
| 4 | Android Studio 설치 → Keystore 생성 → AAB 빌드 | `frontend/android/CREATE_KEYSTORE.md` 참고 |
| 5 | Google Play Console 등록 → AAB 업로드 → 제출 | $25 등록비 |
| 6 | Apple Developer 등록 → Mac에서 Xcode 빌드 → 제출 | $99/년, Mac 필요 |

자세한 가이드: `docs/store-listings/RELEASE_GUIDE.md`

---

## 최근 완료 작업 (2026-04-27) — 크롬 라이브 테스트 & 버그 수정

### [x] COMPLETED — 전체 화면 직접 테스트 + 4개 버그 수정

**수정한 버그**:

1. **WiFi IP 고정 → 런타임 hostname 감지로 변경** (`frontend/src/lib/api.ts`)
   - `NEXT_PUBLIC_API_URL`은 빌드 시 고정됨 → WiFi IP 바뀌면 앱 깨짐
   - 해결: `window.location.hostname`으로 실시간 백엔드 주소 계산
   - 핸드폰 접속 시 자동으로 `http://{핸드폰이_본_IP}:3003` 사용

2. **React Hydration Error #418 완전 해결** (`PortalProvider.tsx`)
   - 원인: `getCachedRole()` (localStorage 읽기)를 render 중 호출 → SSR null vs 클라이언트 값 불일치
   - 해결: `useState("unknown", true)` 고정 초기값 → `useEffect`에서 캐시 적용

3. **신문 탭 전환 그레이/멈춤 현상 해결** (`newspapers/[orderId]/page.tsx`)
   - 원인: 탭 클릭마다 새 API 호출 (10초 타임아웃)
   - 해결: `Map<string, Newspaper>` 캐시로 최초 1회만 API 호출, 재방문은 즉시

4. **AppBar 타이틀 미표시 버그** (`AppBar.tsx`)
   - 원인: `title`은 `showBack`이 true일 때만 표시됨
   - 해결: `title` 있으면 `showBack` 여부와 무관하게 표시, 로고는 둘 다 없을 때만
   - 효과: 프로필("더보기"), 대시보드("내 꿈 시리즈"), 작가/스폰서 탭 제목 정상 표시

5. **KakaoShareButton 스타일 덮어쓰기 버그** (`KakaoShareButton.tsx`)
   - 원인: `style={{ background: "#FEE500" }}` 인라인 스타일이 항상 적용 → className의 `bg-white` 무효화
   - 해결: `className` prop이 있으면 인라인 style 미적용

6. **Supabase 프로젝트 자동 일시정지** (MCP 도구로 복구)
   - 무료 티어 7일 비활성 → INACTIVE → DNS 소실
   - `restore_project`로 복구 → ACTIVE_HEALTHY 확인

**검증한 화면** (모두 이상 없음):
- 홈 피드 (스트릭, 연재 중 시리즈, 꿈 피드) ✅
- 신문 뷰어 (1편/2편/3편 탭 전환 즉시, 공유 버튼 스타일) ✅
- 빈 신문 상태 ("첫 번째 꿈신문을 기다리고 있어요") ✅
- 의뢰 폼 3단계 (글자 수, 비활성 버튼, 플랜 선택, 가격 표시) ✅
- 프로필 페이지 ("더보기" 타이틀) ✅
- 콘솔 오류 없음 ✅

---

## 최근 완료 작업 (2026-05-12) — iOS 자동 배포 파이프라인 구축

### [x] COMPLETED — GitHub Actions iOS CI/CD 파이프라인

**완료 내용**:

1. **`.github/workflows/ios-deploy.yml`** — GitHub Actions macOS 러너로 자동 빌드
   - main 브랜치 push 시 자동 트리거 (frontend/ 변경 시)
   - `npm ci` → `build:app` → `cap sync ios` → `pod install` → `xcodebuild archive` → TestFlight 업로드
   - App Store Connect API 키로 2FA 우회 (비밀번호 없이 업로드)
   - **Mac 없이 Windows에서 완전 자동화** 가능

2. **`frontend/ios/ExportOptions.plist`** — IPA 익스포트 설정
   - App Store 배포용, 서명 방식 manual, Bitcode 비활성

3. **`docs/ios-deploy/SETUP.md`** — 단계별 설정 가이드 (CEO가 직접 진행)
   - Apple Developer 가입 → App Store Connect 앱 생성 → 인증서/프로파일 생성
   - Windows에서 OpenSSL로 인증서 생성하는 방법 포함
   - GitHub Secrets 11개 등록 방법
   - 빌드 시간: ~30분, GitHub Actions 무료 (public repo)

**CEO가 직접 해야 하는 것** (순서 중요):

| 순서 | 작업 | 가이드 |
|------|------|--------|
| 1 | **Apple Developer 등록** ($99/년) | `docs/ios-deploy/SETUP.md` STEP 1 |
| 2 | **App Store Connect 앱 생성** | STEP 2 |
| 3 | **인증서 생성** (Windows OpenSSL) | STEP 3 |
| 4 | **프로비저닝 프로파일 생성** | STEP 4 |
| 5 | **App Store Connect API 키 생성** | STEP 5 |
| 6 | **GitHub Secrets 11개 등록** | STEP 6 |
| 7 | **main push → 자동 빌드 확인** | STEP 7 |
| 8 | **TestFlight 테스터 초대** | STEP 8 |
| 9 | **App Store 심사 제출** | STEP 9 |

---

## 최근 완료 작업 (2026-05-12) — 핵심 비즈니스 버그 수정

### [x] COMPLETED — `daily_publish.py` 스폰서 매칭 NameError 수정

**버그**: `backend/app/tasks/daily_publish.py` 69번째 줄에서 `find_sponsors(order_dict)`를 호출했지만, `order_dict`는 79번째 줄에서야 정의됨 → 매일 발행 시마다 `NameError` 발생 → **실제 브랜드가 기사에 절대 삽입되지 않았음**.

**수정**: `order_dict` 정의를 `find_sponsors()` 호출 이전으로 이동 (lines 65→79 → 65→77).

**임팩트**: 꿈신문사의 핵심 수익 모델인 "실제 기업/브랜드가 기사에 자연 삽입되는 무의식 광고"가 이제 정상 작동함.
- pgvector 벡터 검색으로 유저의 꿈과 연관된 실제 기업 자동 매칭
- 유료 스폰서 우선 선택, 없으면 DB에서 자동 매칭
- `variables_used.sponsor` 필드에 실제 기업명 저장됨

---

---

## 최근 완료 작업 (2026-05-14) — 출시 직전 E2E 전체 테스트 & 버그 수정

### [x] COMPLETED — 크롬 브라우저 직접 제어 E2E 테스트 (출시 전 최종 점검)

**테스트 범위 & 결과**:

| 화면/기능 | 결과 | 비고 |
|-----------|------|------|
| 홈 화면 (스트릭 배너, 연재 시리즈) | ✅ | 2개 주문 카드 동시 표시 정상 |
| 신문 뷰어 EP1/EP2/EP3 전환 | ✅ | 탭 즉시 전환, 캐시 작동 |
| 신문 레이아웃 전체 구성요소 | ✅ | 마스트헤드·헤드라인·서브헤드·리드·2컬럼 본문·오늘의 한마디·성과 지표·스폰서 광고·푸터 |
| 주문 생성 3단계 위저드 | ✅ | Step1 꿈 입력→Step2 주인공→Step3 플랜 선택→성공 페이지 |
| 성공 페이지 (`/order/success`) | ✅ | 타임라인 카드, 카카오 공유 버튼 표시 |
| 대시보드 (`/dashboard`) | ✅ | 준비 중 → 연재 중 상태 자동 전환, 진행률 바 |
| 프로필 (`/profile`) | ✅ | 유저 정보, 메뉴 링크, 버전 표시 |
| 이용약관 (`/terms`) | ✅ | |
| 빈 신문 상태 | ✅ | "내일 오전 8시에 {이름}의 꿈신문 첫 편이 발행됩니다" |
| 백엔드 헬스 | ✅ | status: ok, db_connection: ok |
| 공유하기 버튼 | ✅ (수정 완료) | 아래 버그 수정 내용 참고 |

**수정한 버그**:

1. **`KakaoShareButton` AbortError 미처리** (`frontend/src/components/KakaoShareButton.tsx`)
   - 원인: 데스크탑 Chrome에서 `navigator.share()` 호출 시 `AbortError: Share failed` 발생 → `.catch()` 없어서 클립보드 폴백이 실행되지 않음
   - 수정: `.catch()` 추가 → 공유 실패 시 자동으로 클립보드 복사로 폴백
   - 모바일에서는 Web Share API 정상 작동, 데스크탑은 클립보드 복사로 자동 대체

**발견한 기술적 제약 (외부 자원 필요)**:

| 이슈 | 원인 | 해결 방법 |
|------|------|----------|
| AI 신문 생성 불가 | Gemini 무료 티어 quota 소진 (limit: 0) | Google Cloud Console에서 billing 활성화 **또는** 새 프로젝트 API 키 발급 |
| Claude CLI 대체 불가 | Anthropic 크레딧 부족 | Anthropic 콘솔에서 크레딧 충전 (최소 $5) |
| 프론트엔드 bind mount 없음 | docker-compose.yml에 `./frontend:/app` 마운트 미설정 | `docker compose up --build` 필요 (소스 수정 시마다) — 개발 속도 개선 필요 |

> **요약**: UI/UX는 100% 완성, AI 생성 엔진만 API 키/크레딧 충전으로 즉시 가동 가능

---

## 최근 완료 작업 (2026-05-15) — Claude CLI OAuth 전환 & 신문 생성 E2E 검증

### [x] COMPLETED — Gemini SDK → Claude CLI (OAuth 구독형) 전환

**변경 내용**:

1. **`backend/app/agents/base_agent.py`** 완전 재작성
   - Gemini SDK 제거 → `claude -p <prompt> --model <model>` subprocess 방식
   - `ANTHROPIC_API_KEY` 환경변수 제거 → OAuth 토큰 자동 사용 (`~/.claude/.credentials.json`)
   - `CLAUDE_CONFIG_DIR=/root/.claude` (Docker bind mount로 Windows 호스트 인증 공유)
   - ANSI 이스케이프 코드 자동 제거, 재시도 로직 (10s/30s/60s) 유지

2. **`backend/app/config.py`** 모델명 전환
   - `ORCHESTRATOR_MODEL`: `claude-sonnet-4-5-20250929`
   - `WRITER_MODEL`: `claude-haiku-4-5-20251001`
   - `SPONSOR_MODEL`: `claude-haiku-4-5-20251001`

3. **Gemini 직접 호출 에이전트 3개 → BaseAgent 전환**
   - `marketing_director/agent.py` — SNS 카피 생성
   - `content_director/agent.py` — 이미지 프롬프트 생성
   - `hr_manager/agent.py` — 작가 배정 결정 / AI 초안 생성

**E2E 신문 생성 검증 결과**:

| 단계 | 결과 | 비고 |
|------|------|------|
| Claude CLI OAuth 인증 | ✅ | Pro 구독 정상 작동 |
| 스폰서 매칭 (AdSales) | ✅ | 드림테크 주식회사 자동 매칭 |
| WriterAgent 신문 생성 | ✅ | 27초 소요 |
| EditorInChief 품질 검사 | ✅ | 2회 재시도 후 발행 승인 |
| DB 저장 | ✅ | newspaper_id: 94f73238... |
| 신문 UI 렌더링 | ✅ | 헤드라인·본문·사이드바·스폰서·푸터 완벽 |
| 공유하기 버튼 | ✅ | 표시 확인 |
| 총 생성 시간 | ✅ | 147초 (스폰서 매칭 포함) |

**남은 개선 사항**:
- Claude Pro 월간 사용량 한도: 연속 대량 생성 시 rate limit 가능 → Max 플랜 고려
- `--dangerously-skip-permissions` 제거 완료 (root 환경 대응)

---

## 최근 완료 작업 (2026-05-16) — SSE 실시간 진행 화면 구현

### [x] COMPLETED — 신문 생성 대기 중 실시간 진행 상황 화면

**배경**: "의뢰 제출 후 2~3분 대기 시간에 뭘 보여줄까?" CEO 브레인스토밍 결과 → SSE 진행 화면 구현

**구현 내용**:

1. **`backend/app/core/progress_store.py`** (신규)
   - asyncio.Queue 기반 인메모리 SSE 이벤트 스토어
   - `emit()`: 이벤트 발행 → 모든 구독자에게 실시간 전달
   - `subscribe()`: 구독 등록 + 기존 이벤트 재생 (late join 지원)
   - `cleanup()`: 신문 생성 완료 후 메모리 정리

2. **`backend/app/api/v1/progress.py`** (신규)
   - `GET /api/v1/orders/{order_id}/progress` — SSE 스트리밍 엔드포인트
   - 30초 keepalive ping, `done` 이벤트 수신 시 자동 종료
   - `POST /api/v1/orders/{order_id}/test-emit` — 개발용 emit 테스트

3. **`backend/app/tasks/daily_publish.py`** (수정)
   - 5단계 SSE emit 추가:
     - `starting` → `sponsor_matching` → `writing` → `quality_check` → `done`
   - `done` 이벤트에 `newspaper_id`, `order_id` 포함

4. **`backend/app/api/v1/orders.py`** (수정)
   - free 티어 의뢰 즉시 생성 (8시 스케줄러 대기 없이 `process_single_schedule()` 직접 호출)

5. **`frontend/src/app/(dashboard)/order/generating/page.tsx`** (신규)
   - 5단계 진행 UI: StageIcon (체크/스피너/회색 원) + 연결선
   - EventSource → `${apiUrl}/api/v1/orders/${orderId}/progress`
   - `done` 이벤트 수신 → "지금 바로 신문 보기" 버튼 + 3초 후 자동 이동
   - 5분 타임아웃 → "연결이 끊겼습니다" fallback + 대시보드 안내
   - Suspense로 감싸 `useSearchParams()` hydration 대응

6. **`frontend/src/components/forms/OrderForm.tsx`** (수정)
   - 의뢰 완료 후 `/order/success` → `/order/generating?orderId={id}` 로 변경

**E2E 검증 완료** (SSE test-emit 엔드포인트 활용):
- starting → sponsor_matching → writing → quality_check → done 순서 UI 업데이트 ✅
- 각 단계 bold active 표시 + "진행 중..." 서브텍스트 ✅
- done 이벤트 수신 후 3초 뒤 `/newspapers/{orderId}` 자동 리다이렉트 ✅

---

## 최근 완료 작업 (2026-05-19~22) — 크레딧 결제 + 스폰서 포털

### [x] COMPLETED — Stripe 크레딧 결제 시스템

1. **크레딧 팩 구매 (Stripe Checkout)**
   - `backend/app/api/v1/payment.py` — 크레딧 팩 3종 (스타터 10개/4,900원, 인기 30개/12,900원, 파워 100개/39,900원)
   - Stripe Webhook → `credit_transactions` 테이블 자동 적립
   - `frontend/src/app/(dashboard)/credits/page.tsx` — 잔액 조회 + 팩 구매 UI
   - `frontend/src/app/payment/credits/success/page.tsx` — 결제 완료 확인 화면

2. **꿈 의뢰 → 크레딧 차감 연동**
   - 의뢰 생성 시 잔액 검증 → 시작 시 원자적 차감
   - `orders.py` start_order에 CreditTransaction 생성

3. **OrderForm 한 화면 최적화**
   - `position: fixed; inset: 0` → 루트 레이아웃 pb-safe-nav 60px 우회
   - 3단계 전부 390×844 스크롤 없이 완전 핏

### [x] COMPLETED — 작가/스폰서 포털 분리 운영

- `docker-compose.yml`: frontend-writer(3001) + frontend-sponsor(3002) 서비스 추가
- 동일 이미지, 역할별 로그인 후 자동 라우팅
  - 3001: 작가 계정 → /writer/dashboard
  - 3002: 스폰서 계정 → /sponsor/dashboard

### [x] COMPLETED — 스폰서 지면 안내 + 광고 단가 확정

- 스폰서 대시보드 "지면 안내" 탭 신규 추가
  - 실제 신문 레이아웃 미니 미리보기 (① 본문 네이티브, ② 사이드바 광고 위치 표시)
  - 두 지면 상세 설명 + ChromaDB 매칭 플로우

- 광고 단가 확정 (재무/그로스 팀 토론 결과):
  - 네이티브 본문 삽입: **100원/노출**
  - 사이드바 광고 박스: **30원/노출**

- 슬롯 구매 페이지 전면 재설계 (`/sponsor/slots`)
  - 패키지 3종: 파일럿(6,500원) / 스탠다드(39,000원) / 프리미엄(130,000원)
  - 수량 슬라이더 + 실시간 견적 계산
  - 슬롯 활성화 후 청구서 발행 방식

---

## ✅ 완료 (2026-06-14) — 프로덕션 배포 + 이메일 시스템 구축

### 🌐 라이브 URL (최신)
| 서비스 | URL | 상태 |
|--------|-----|------|
| **Vercel 프론트엔드** | https://dream-newspaper-phi.vercel.app | ✅ LIVE |
| **Render 백엔드** | https://dream-newspaper.onrender.com (또는 Render 대시보드 확인) | ✅ LIVE |
| **도메인** | dreamnewspaper.com (Cloudflare) | ✅ 구매 완료 |

### 완료된 작업
- ✅ Render 무료 플랜 백엔드 배포 (Docker + FastAPI)
- ✅ Vercel 프론트엔드 배포 (CLI 직접 배포)
- ✅ 연도 2035 → 2027 전체 변경 (TypingLanding, onboarding, OrderForm)
- ✅ dreamnewspaper.com 도메인 구매 (Cloudflare)
- ✅ Resend 도메인 인증 완료 (dreamnewspaper.com, Tokyo 리전)
- ✅ Magic Link 이메일 발신자: `꿈신문사 <noreply@dreamnewspaper.com>`

## ✅ 완료 (2026-06-14) — Render DB 연결 수정

### 해결된 문제
1. **asyncpg → psycopg3 교체** — asyncpg가 Render에서 DNS 실패
2. **패스워드 내 `@` 문자 처리** — psycopg URL 파서 버그 → `SaURL.create()` + Python urlparse로 해결
3. **직접 연결(IPv6) → Session Pooler(IPv4) 교체** — Render 무료 티어 IPv6 미지원

### 현재 상태
- `host`: `aws-1-ap-northeast-2.pooler.supabase.com` ✅
- `/health`: `status: ok, db_connection: ok` ✅
- 이메일 로그인 / 구글 OAuth / Magic Link 모두 정상 작동

## ✅ 완료 (2026-06-15) — 카카오 로그인 E2E + 역할별 리다이렉트 + 온보딩 모달

### 완료된 작업

1. **카카오 로그인 E2E 완전 동작**
   - KOE205 에러 원인: 동의항목 미설정 (account_email, profile_image 선택 동의 필요)
   - Redirect URI 위치: 카카오 Developer → 앱 > 플랫폼 키 > REST API 키 섹션 (일반 탭 아님)
   - 설정 완료 후 카카오 로그인 정상 작동

2. **로그인 후 역할별 자동 리다이렉트**
   - `frontend/src/app/auth/callback/page.tsx` — `/auth/callback`에서 역할 감지 → 대시보드 이동
   - `frontend/src/lib/auth.ts` — `roleToHome()`: user→`/dashboard`, writer→`/writer/dashboard`, sponsor→`/sponsor/dashboard`
   - 이전: 로그인 후 랜딩페이지(`/`)로 이동 → 수정: 역할 대시보드로 직행

3. **온보딩 페이지 리다이렉트 제거**
   - `/register/page.tsx`: `"/onboarding"` 하드코딩 인자 제거
   - `/auth/callback/page.tsx`: `/onboarding` 경유 없이 바로 대시보드 이동
   - 온보딩 페이지는 레거시로만 존재, 신규 유저는 모달로 처리

4. **신규 유저 설정 모달 (Setup Modal)**
   - 카카오/매직링크 로그인 신규 유저는 이름이 "꿈 참여자"(기본값)로 설정됨
   - `/dashboard` 진입 시 이름 미설정 감지 → 이름 입력 + 역할 선택 모달 자동 표시
   - 저장 완료 → `PATCH /auth/me` → 역할에 맞는 대시보드로 이동
   - `frontend/src/app/(dashboard)/dashboard/page.tsx`에 `SetupModal` 컴포넌트 구현

5. **백엔드 PATCH /auth/me 엔드포인트 추가**
   - `backend/app/api/v1/auth.py` — 이름/역할 업데이트 API
   - `backend/app/schemas/user.py` — `UserProfileUpdate` 스키마 추가
   - GitHub push → Render 자동 배포 완료

6. **GitHub → Render 자동 배포 확인**
   - `psynetxten/Dream_Company` main 브랜치 push → Render 백엔드 자동 재빌드
   - 프론트엔드: Vercel (dreamnewspaper.com)
   - 백엔드: Render (GitHub 연동 자동 배포)

### 남은 확인 필요 사항
- [ ] 실제 신규 카카오 유저로 Setup Modal 동작 테스트

---

## ✅ 완료 (2026-06-16) — 프로덕션 API 연결 + JWT 로컬 검증

1. **SUPABASE_JWT_SECRET 로컬 JWT 검증 활성화**
   - `backend/app/api/v1/auth.py` — python-jose로 로컬 검증 (네트워크 호출 없음, 수 밀리초)
   - SUPABASE_JWT_SECRET 미설정 시 run_in_executor 폴백 유지
   - 검증: `/auth/me` invalid token → `"Invalid token"` 응답 ✅
   - Render 환경변수 추가 완료 (CEO 직접)

2. **dreamnewspaper.com → Vercel 커스텀 도메인 이미 연결되어 있었음**
   - HTTP 200 정상 응답 확인 ✅

3. **NEXT_PUBLIC_API_URL 수정** (핵심 버그)
   - 기존: 빈 값 → `localhost:3003` 호출 → 프로덕션에서 API 전혀 안 됨
   - 수정: `https://dream-newspaper-backend.onrender.com`
   - Vercel 재배포 완료 (30페이지 전체 빌드 성공) ✅

### 현재 프로덕션 상태
| 서비스 | URL | 상태 |
|--------|-----|------|
| 프론트엔드 | https://dreamnewspaper.com | ✅ LIVE |
| 백엔드 | https://dream-newspaper-backend.onrender.com | ✅ LIVE |
| JWT 검증 | 로컬 (python-jose) | ✅ 빠름 |
| 이메일 발신 | noreply@dreamnewspaper.com (Resend) | ✅ 인증 완료 |

---

## ✅ 완료 (2026-06-16) — 프로덕션 DB 전체 마이그레이션

### 문제
`/api/v1/stats` 등 모든 DB 의존 엔드포인트 500 에러 — `sponsors` 테이블 없음

### 원인
프로덕션 Supabase DB에 Alembic 마이그레이션이 전혀 적용 안 된 상태. `users`, `orders`, `newspapers`, `vector_items`만 컬럼도 적게 존재.

### 수정 (Supabase MCP로 직접 SQL 실행)
- **누락 테이블 8개 생성**: `sponsors`, `sponsor_slots`, `writer_profiles`, `publication_schedules`, `agent_logs`, `notifications`, `refresh_tokens`, `credit_transactions`
- **템플릿 테이블 4개 생성**: `template_series`, `template_episodes`, `template_slots`, `template_purchases`
- **`users` 누락 컬럼 추가**: `role`, `password_hash`, `is_verified`, `oauth_provider`, `oauth_provider_id`, `organization_id`, `credits`, `subscription_plan`, `subscription_expires_at`, `updated_at`; email nullable 수정
- **`orders` 누락 컬럼 추가**: `supporting_people`, `series_theme`, `future_year`, `payment_type`, `payment_status`, `amount_krw`, `merchant_uid`, `imp_uid`, `payment_method`, `stripe_session_id`, `stripe_payment_intent_id`, `assigned_writer_id`, `writer_type`, `publish_time`, `timezone`, `updated_at`, `starts_at`, `ends_at`
- **`newspapers` 누락 컬럼 추가**: `future_date`, `subhead`, `lead_paragraph`, `sidebar_content`, `variables_used`, `status`, `scheduled_at`, `sns_copy`, `visual_prompt` 등 15개
- **진단 코드 제거**: `stats.py`, `main.py` 디버그 블록 정리
- **검증**: `SELECT COUNT(*) FROM sponsors` → 정상 ✅; 전체 16개 테이블 존재 확인 ✅
- **배포**: `psynetxten/Dream_Company` main 푸시 → Render 자동 배포 중

---

## 다음 할 일

### 즉시 가능
- [ ] RESEND_API_KEY → Render 환경변수 추가 (이메일 알림 기능 붙일 때)
- [ ] 실제 신규 카카오 유저로 Setup Modal 동작 테스트 (https://dreamnewspaper.com)

### iOS (즉시 시작 가능)
- [ ] Apple Developer Program 등록 ($99/년) — `docs/ios-deploy/SETUP.md` 참고
- [ ] App Store Connect 앱 생성 (com.dreamnewspaper.app)
- [ ] 인증서 + 프로비저닝 프로파일 생성 (Windows OpenSSL 사용)
- [ ] GitHub Secrets 11개 등록
- [ ] GitHub에 코드 push → 자동 빌드 → TestFlight 확인

### Phase 2 기능
- [ ] Portone 결제 연동 (프리미엄 티어)
- [ ] Stripe 테스트 결제 검증 (STRIPE_SECRET_KEY 환경변수 필요)
- [ ] 커스텀 404 페이지 (현재 Next.js 기본)
- [ ] 스폰서 슬롯 Stripe 결제 연동 (현재 청구서 수동 발행 방식)
- [ ] Android: Keystore 생성 + AAB 빌드 + Google Play Console ($25)

---

## 현재 서비스 상태

| 서비스 | URL | 상태 |
|--------|-----|------|
| 프론트엔드 (로컬) | http://localhost:3000 | ✅ 운영 중 |
| 백엔드 API (로컬) | http://localhost:3003 | ✅ 운영 중 |
| 프론트엔드 (프로덕션) | https://dream-newspaper-phi.vercel.app | ✅ LIVE |
| 이메일 발신 | noreply@dreamnewspaper.com (Resend) | ✅ 인증 완료 |

## 주요 진입점
- 일반 회원가입: http://localhost:3000/register
- 작가 지원: http://localhost:3000/register/writer
- 스폰서 등록: http://localhost:3000/register/sponsor
- 로그인: http://localhost:3000/login
