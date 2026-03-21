"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/lib/api";
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
        document.cookie = "dream_role=; path=/; max-age=0";
        return;
      }

      // 로컬 DB의 role이 항상 정확 — /auth/me API 사용
      const res = await authApi.me();
      const role: string = res.data?.role || "user";

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
