"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { setRoleCookie } from "@/lib/auth";

type PortalType = "user" | "writer" | "sponsor" | "unknown";

interface PortalContextType {
  portalType: PortalType;
  isLoading: boolean;
}

const PortalContext = createContext<PortalContextType>({
  portalType: "unknown",
  isLoading: true,
});

export const usePortal = () => useContext(PortalContext);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [portalType, setPortalType] = useState<PortalType>("unknown");
  const [isLoading, setIsLoading] = useState(true);

  const detectRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPortalType("user");
        // 혹시 남아있는 쿠키 제거
        document.cookie = "dream_role=; path=/; max-age=0";
        return;
      }

      const role: string =
        user.user_metadata?.role || user.app_metadata?.role || "user";

      // 미들웨어가 읽을 수 있도록 쿠키 동기화
      setRoleCookie(role);

      if (role === "writer") setPortalType("writer");
      else if (role === "sponsor") setPortalType("sponsor");
      else setPortalType("user");
    } catch {
      setPortalType("user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    detectRole();

    // 로그인 / 로그아웃 등 세션 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      detectRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <PortalContext.Provider value={{ portalType, isLoading }}>
      {children}
    </PortalContext.Provider>
  );
}
