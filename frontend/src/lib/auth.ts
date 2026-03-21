import { supabase } from "./supabase";
import { authApi } from "./api";

/** 역할 쿠키 이름 */
export const ROLE_COOKIE = "dream_role";

/** 로그인 후 역할 쿠키 설정 */
export function setRoleCookie(role: string) {
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=86400; SameSite=Lax`;
}

/** 로그아웃 — Supabase 세션 + 역할 쿠키 동시 제거 */
export async function signOut() {
  await supabase.auth.signOut();
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
  window.location.href = "/login";
}

/**
 * 현재 사용자 역할 조회
 * Supabase 메타데이터가 아닌 로컬 DB(/auth/me)에서 가져옴 — 항상 정확
 */
export async function getUserRole(): Promise<string> {
  try {
    const res = await authApi.me();
    return res.data?.role || "user";
  } catch {
    return "user";
  }
}

/** 역할 → 홈 경로 */
export function roleToHome(role: string): string {
  if (role === "writer") return "/writer/dashboard";
  if (role === "sponsor") return "/sponsor/dashboard";
  return "/dashboard";
}

/**
 * 회원가입 후 자동 로그인 + 쿠키 설정 + 리다이렉트
 * 모든 가입 페이지에서 공통으로 사용
 */
export async function registerAndLogin(
  email: string,
  password: string,
  full_name: string,
  role: "user" | "writer" | "sponsor",
  apiUrl: string
): Promise<void> {
  // 1. 회원가입
  const regRes = await fetch(`${apiUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name, role }),
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(regData.detail || "회원가입에 실패했습니다.");

  // 2. 자동 로그인
  const loginRes = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error("자동 로그인에 실패했습니다. 직접 로그인해 주세요.");

  // 3. Supabase 세션 설정
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: loginData.access_token,
    refresh_token: loginData.refresh_token,
  });
  if (sessionError) throw sessionError;

  // 4. 쿠키 설정 후 역할 홈으로 이동
  setRoleCookie(role);
  window.location.href = roleToHome(role);
}
