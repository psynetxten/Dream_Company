import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 꿈신문사 통합 라우팅 미들웨어
 *
 * dream_role 쿠키 기준:
 *   없음       → guest (비로그인)
 *   "user"     → 일반 독자
 *   "writer"   → 작가
 *   "sponsor"  → 스폰서
 *   "admin"    → 관리자
 */

const ROLE_COOKIE = "dream_role";

// 로그인이 필요한 경로 (prefix)
const AUTH_REQUIRED = ["/dashboard", "/order", "/writer", "/sponsor", "/admin"];

// 역할별 접근 제한
const ROLE_GUARD: Record<string, string[]> = {
  "/writer": ["writer", "admin"],
  "/sponsor": ["sponsor", "admin"],
  "/admin": ["admin"],
};

// 가입/온보딩 경로 — 인증만 되면 역할 무관하게 접근 허용
// (아직 sponsor/writer가 아닌 유저가 해당 역할로 "전환/지원"하는 진입점)
const ROLE_GUARD_EXEMPT = ["/sponsor/register", "/writer/apply"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ROLE_COOKIE)?.value ?? null;
  const isLoggedIn = !!role;

  // ── 1. 비로그인 → 보호 경로 접근 차단 ──────────────────
  const needsAuth = AUTH_REQUIRED.some((p) => pathname.startsWith(p));
  if (needsAuth && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ── 2. 역할 불일치 → 해당 역할 홈으로 리다이렉트 ──────
  const isOnboardingPath = ROLE_GUARD_EXEMPT.some((p) => pathname.startsWith(p));
  for (const [prefix, allowed] of Object.entries(ROLE_GUARD)) {
    if (isOnboardingPath) break; // 가입/온보딩은 역할 가드 면제 (인증은 위에서 이미 확인)
    if (pathname.startsWith(prefix) && !allowed.includes(role ?? "")) {
      const home =
        role === "writer"
          ? "/writer/dashboard"
          : role === "sponsor"
          ? "/sponsor/dashboard"
          : "/";
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  // ── 3. 이미 로그인한 상태에서 /login 접근 → 해당 홈으로 ─
  if (pathname === "/login" && isLoggedIn) {
    const home =
      role === "writer"
        ? "/writer/dashboard"
        : role === "sponsor"
        ? "/sponsor/dashboard"
        : "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 정적 파일, _next, api 경로 제외한 모든 경로
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
