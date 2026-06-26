"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 스폰서 등록 경로 통합 (2026-06-26)
 * 기존 이 페이지는 email+password(registerAndLogin)로 계정+role을 한 번에 만들었으나,
 * 클라이언트가 role을 지정하는 비보안 경로였다. 정본은 `/sponsor/register`
 * (로그인 후 sponsorApi.register → 서버가 role 부여). 가드(middleware)가
 * 미로그인 시 자동으로 /login?next=/sponsor/register 로 보낸다.
 */
export default function SponsorRegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sponsor/register");
  }, [router]);
  return null;
}
