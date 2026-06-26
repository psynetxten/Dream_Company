"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserRole, setRoleCookie, roleToHome } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let session = (await supabase.auth.getSession()).data.session;

        if (!session) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (error) throw error;
          session = (await supabase.auth.getSession()).data.session;
        }

        if (!session) throw new Error("세션을 가져올 수 없습니다.");

        const role = await getUserRole();
        setRoleCookie(role);

        // 진입 의도(next) 보존 — 콜드 게스트가 작가/스폰서 온보딩 등으로
        // 들어오던 흐름을 Magic Link 왕복 후에도 유지. 내부 경로만 허용(오픈리다이렉트 차단).
        const next = new URLSearchParams(window.location.search).get("next");
        const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
        router.replace(safeNext || roleToHome(role));
      } catch (err: unknown) {
        setMessage(err instanceof Error ? err.message : "인증에 실패했습니다.");
        setStatus("error");
        setTimeout(() => router.replace("/"), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F4EE", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Serif KR', serif", gap: "1.5rem" }}>
      <p style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, color: "#1A2744", letterSpacing: "0.15em" }}>꿈신문사</p>
      <p style={{ color: status === "error" ? "#c0392b" : "#555", fontFamily: "system-ui, sans-serif", fontSize: "1rem", textAlign: "center" }}>
        {status === "loading" ? "로그인 중..." : message}
      </p>
      {status === "error" && (
        <p style={{ color: "#888", fontSize: "0.8rem", fontFamily: "system-ui, sans-serif" }}>잠시 후 처음 화면으로 돌아갑니다.</p>
      )}
    </div>
  );
}
