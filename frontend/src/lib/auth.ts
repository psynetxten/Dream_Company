import { supabase } from "./supabase";

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

/** Supabase 세션에서 역할 추출 */
export async function getUserRole(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "guest";
  return (
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    "user"
  );
}

/** 역할 → 홈 경로 */
export function roleToHome(role: string): string {
  if (role === "writer") return "/writer/dashboard";
  if (role === "sponsor") return "/sponsor/dashboard";
  return "/dashboard";
}
