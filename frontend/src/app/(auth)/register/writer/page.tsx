"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 작가 가입 경로 통합 (2026-06-26)
 * 기존 이 페이지는 email+password(registerAndLogin)로 계정+role을 한 번에 만들고
 * 필명/전문분야/자기소개를 백엔드로 보내지 않아 버렸다. 정본은 `/writer/apply`
 * (Magic Link 인증 후 writerApi.apply → 서버가 프로필 저장 + role 승격).
 * 가드(middleware)가 미로그인 시 자동으로 /login?next=/writer/apply 로 보낸다.
 */
export default function WriterRegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/writer/apply");
  }, [router]);
  return null;
}
