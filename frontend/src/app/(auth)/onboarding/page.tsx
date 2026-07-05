"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";

interface Stats {
  user_count: number;
  newspaper_count: number;
  sponsor_count: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [dream, setDream] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 유저 이름 가져오기
    supabase.auth.getSession().then(({ data }) => {
      const n = data.session?.user?.user_metadata?.name;
      if (n) setName(n);
    });

    // 통계 가져오기
    fetch(`${getApiBaseUrl()}/api/v1/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dream.trim().length < 10) return;
    setSubmitting(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("로그인이 필요합니다.");

      const orderRes = await fetch(`${getApiBaseUrl()}/api/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          dream_description: dream.trim(),
          protagonist_name: name || "독자",
          target_role: dream.trim().slice(0, 200),
          duration_days: 3,
          payment_type: "free",
          future_year: 2027,
          supporting_people: [],
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.detail || "주문 생성에 실패했습니다.");
      }

      const order = await orderRes.json();

      await fetch(`${getApiBaseUrl()}/api/v1/orders/${order.id}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}천` : String(n);

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F4EE", fontFamily: "'Noto Serif KR', serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap');`}</style>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* 마스트헤드 */}
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1A2744", letterSpacing: "0.2em", borderBottom: "2px double #1A2744", paddingBottom: "0.3em", marginBottom: "2.5rem", display: "inline-block" }}>
          꿈신문사
        </p>

        {/* 환영 헤드라인 */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.75rem", color: "#C9A84C", fontFamily: "system-ui, sans-serif", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
            EXCLUSIVE INVITATION
          </p>
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, color: "#1A2744", lineHeight: 1.4, margin: "0 0 0.75rem" }}>
            {name ? `${name}씨, 환영합니다.` : "환영합니다."}
          </h1>
          <p style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.05rem)", color: "#555", lineHeight: 1.8, fontFamily: "system-ui, sans-serif" }}>
            꿈신문사 기자단이 당신의 미래를 오늘의 신문으로 매일 배달합니다.
            <br />첫 호를 받으려면 꿈을 알려주세요.
          </p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div style={{ background: "#1A2744", color: "#F7F4EE", padding: "1.25rem 1.5rem", marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: "#C9A84C", marginBottom: "1rem", fontFamily: "system-ui, sans-serif" }}>
              지금 꿈신문사에서는
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", textAlign: "center" }}>
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.15)", paddingRight: "1rem" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{fmt(stats.user_count)}</p>
                <p style={{ fontSize: "0.65rem", color: "#C9A84C", margin: "4px 0 0", fontFamily: "system-ui, sans-serif", lineHeight: 1.4 }}>명이 함께<br />꿈을 꾸고 있어요</p>
              </div>
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.15)", padding: "0 1rem" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{fmt(stats.newspaper_count)}</p>
                <p style={{ fontSize: "0.65rem", color: "#C9A84C", margin: "4px 0 0", fontFamily: "system-ui, sans-serif", lineHeight: 1.4 }}>편의 미래 신문이<br />발행됐어요</p>
              </div>
              <div style={{ paddingLeft: "1rem" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{fmt(stats.sponsor_count)}</p>
                <p style={{ fontSize: "0.65rem", color: "#C9A84C", margin: "4px 0 0", fontFamily: "system-ui, sans-serif", lineHeight: 1.4 }}>개 기업이 당신 같은<br />인재를 찾고 있어요</p>
              </div>
            </div>
          </div>
        )}

        {/* 꿈 입력 */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.85rem", color: "#888", fontFamily: "system-ui, sans-serif", letterSpacing: "0.05em" }}>
            2027년의 {name || "당신"}씨는 어떤 삶을 살고 있나요?
          </label>
          <textarea
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder={"카카오 수석 엔지니어로 매일 아침 팀 회의를 주재하며,\n세상을 바꾸는 제품을 만들고 있습니다."}
            rows={5}
            maxLength={500}
            style={{
              padding: "1rem",
              border: "none",
              borderBottom: "2px solid #C9A84C",
              background: "rgba(255,255,255,0.6)",
              fontSize: "1rem",
              fontFamily: "'Noto Serif KR', serif",
              color: "#2C2C2C",
              outline: "none",
              resize: "none",
              lineHeight: 1.9,
              boxSizing: "border-box",
              width: "100%",
            }}
          />
          <p style={{ fontSize: "0.7rem", color: "#BCBCB0", fontFamily: "system-ui, sans-serif", margin: 0 }}>
            {dream.length}/500 · 10자 이상 입력해주세요
          </p>
          {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", margin: 0, fontFamily: "system-ui, sans-serif" }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting || dream.trim().length < 10}
            style={{
              marginTop: "0.5rem",
              padding: "1rem",
              background: submitting || dream.trim().length < 10 ? "#aaa" : "#1A2744",
              color: "#F7F4EE",
              border: "none",
              fontSize: "1rem",
              fontFamily: "system-ui, sans-serif",
              cursor: submitting || dream.trim().length < 10 ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "신문 준비 중..." : "꿈신문 첫 호 발행하기"}
          </button>
        </form>

      </div>
    </div>
  );
}
