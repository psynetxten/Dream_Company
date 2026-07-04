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
  if (role === "admin") return "/admin";
  return "/dashboard";
}
