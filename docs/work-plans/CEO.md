# 꿈신문사 CEO ↔ CTO 소통 파일

---

## ✅ 완료 (2026-05-31) — 매직링크 온보딩 플로우 완성

### CEO 대기 중인 항목 (CTO가 기다리고 있음)
| 순서 | 작업 | 상태 |
|------|------|------|
| 1 | Anthropic Console 자동충전 설정 + API 키 발급 | ⬜ 대기 |
| 2 | Vercel 배포 (junholee940930@gmail.com 계정 → GitHub 연결) | ⬜ 대기 |
| 3 | Railway 가입 + 백엔드 배포 | ⬜ 대기 |
| 4 | Stripe Live 키 발급 | ⬜ 대기 |

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

## 다음 할 일

### ✅ 서비스 가동 조건 충족
- AI 신문 생성: Claude CLI Pro 구독으로 정상 가동 중

### iOS (즉시 시작 가능)
- [ ] Apple Developer Program 등록 ($99/년) — `docs/ios-deploy/SETUP.md` 참고
- [ ] App Store Connect 앱 생성 (com.dreamnewspaper.app)
- [ ] 인증서 + 프로비저닝 프로파일 생성 (Windows OpenSSL 사용)
- [ ] GitHub Secrets 11개 등록
- [ ] GitHub에 코드 push → 자동 빌드 → TestFlight 확인

### 배포 인프라 (iOS 완료 후)
- [ ] Railway + Vercel 배포 → 실제 URL 확정 (CEO 직접)
- [ ] capacitor.config.ts PRODUCTION_URL 업데이트 (URL 확정 후 CTO)
- [ ] Android: Keystore 생성 + AAB 빌드 + Google Play Console ($25)

### Phase 2 기능
- [ ] Stripe 테스트 결제 검증 (STRIPE_SECRET_KEY 환경변수 필요)
- [ ] Resend 이메일 테스트 (RESEND_API_KEY 환경변수 필요)
- [ ] 커스텀 404 페이지 (현재 Next.js 기본)
- [ ] 스폰서 슬롯 Stripe 결제 연동 (현재 청구서 수동 발행 방식)

---

## 현재 서비스 상태

| 서비스 | URL | 상태 |
|--------|-----|------|
| 프론트엔드 (통합) | http://localhost:3000 | ✅ 운영 중 |
| 백엔드 API | http://localhost:3003 | ✅ 운영 중 |
| API 문서 | http://localhost:3003/docs | ✅ |
| 모바일 테스트 | http://{PC_IP}:3000 | ✅ (WiFi 연결, IP 자동 감지 — 재빌드 불필요) |

## 주요 진입점
- 일반 회원가입: http://localhost:3000/register
- 작가 지원: http://localhost:3000/register/writer
- 스폰서 등록: http://localhost:3000/register/sponsor
- 로그인: http://localhost:3000/login
