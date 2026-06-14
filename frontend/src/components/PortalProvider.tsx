"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/lib/api";
import { setRoleCookie } from "@/lib/auth";

type PortalType = "user" | "writer" | "sponsor" | "guest" | "unknown";

interface PortalContextType {
  portalType: PortalType;
  isLoading: boolean;
}

const PortalContext = createContext<PortalContextType>({
  portalType: "unknown",
  isLoading: true,
});

export const usePortal = () => useContext(PortalContext);

const ROLE_CACHE_KEY = "dream_portal_role";

function getCachedRole(): PortalType | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(ROLE_CACHE_KEY) as PortalType) || null;
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  // SSR 일관성: 서버/클라이언트 초기 state를 항상 동일하게 → React #418 Hydration 에러 방지
  // (localStorage는 SSR에서 undefined → getCachedRole()이 null → 클라이언트와 mismatch)
  const [portalType, setPortalType] = useState<PortalType>("unknown");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // 마운트 직후 캐시 즉시 적용 → 로딩 플래시 최소화 (SSR 이후 클라이언트에서만 실행)
    const cached = getCachedRole();
    if (cached) {
      setPortalType(cached);
      setIsLoading(false);
    }

    const verify = async () => {
      try {
        // ✅ getSession() → 네트워크 없이 localStorage에서 즉시 읽음 (0ms)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!cancelled) {
            setPortalType("guest");
            localStorage.removeItem(ROLE_CACHE_KEY);
            document.cookie = "dream_role=; path=/; max-age=0";
          }
          return;
        }

        // 캐시가 있으면 백그라운드 검증만 — UI는 즉시 표시됨
        // 캐시가 없으면 role 확인 후 표시
        const res = await authApi.me();
        if (cancelled) return;

        const role: string = res.data?.role || "user";
        const newType: PortalType =
          role === "writer" ? "writer" : role === "sponsor" ? "sponsor" : "user";

        setRoleCookie(role);
        localStorage.setItem(ROLE_CACHE_KEY, newType);
        setPortalType(newType);
      } catch {
        if (!cancelled && !getCachedRole()) {
          setPortalType("guest");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        // 명시적 로그아웃 또는 세션 만료 시에만 guest로 전환
        localStorage.removeItem(ROLE_CACHE_KEY);
        setPortalType("guest");
        setIsLoading(false);
        document.cookie = "dream_role=; path=/; max-age=0";
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // 로그인/토큰 갱신 시 재검증 (이전 verify 취소 후 새로 시작)
        cancelled = true;
        cancelled = false;
        verify();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PortalContext.Provider value={{ portalType, isLoading }}>
      {children}
    </PortalContext.Provider>
  );
}
