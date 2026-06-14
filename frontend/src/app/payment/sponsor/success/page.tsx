"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sponsorApi } from "@/lib/api";

function SponsorSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  const [slots, setSlots] = useState<{ total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { router.replace("/sponsor/slots"); return; }

    const timer = setTimeout(() => {
      sponsorApi.getSlots()
        .then((res) => setSlots({ total: res.data.length }))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId, router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F0F0F",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      gap: 24,
    }}>
      <div style={{ fontSize: 56 }}>📰</div>

      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "#CC2200", letterSpacing: "0.3em", fontWeight: "bold" }}>
          결제 완료
        </p>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: "bold", color: "#F5F0E8", fontFamily: "Georgia, serif" }}>
          광고 슬롯이 활성화됐습니다
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6B6869", lineHeight: 1.6 }}>
          다음 신문 발행 사이클부터<br />브랜드가 기사에 자연스럽게 등장합니다
        </p>
      </div>

      {loading ? (
        <div style={{ height: 56, width: 180, background: "#2A2A2A", borderRadius: 12 }} />
      ) : (
        <div style={{
          background: "#1A1A1A",
          borderRadius: 16,
          padding: "20px 40px",
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 40, fontWeight: "bold", color: "#F5F0E8", fontFamily: "Georgia, serif" }}>
            {slots?.total ?? "—"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B6869" }}>보유 슬롯 수</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
        <button
          onClick={() => router.push("/sponsor/dashboard")}
          style={{
            background: "#F5F0E8",
            color: "#1A1A1A",
            padding: "14px 0",
            borderRadius: 12,
            fontWeight: "bold",
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          대시보드로 이동 →
        </button>
        <button
          onClick={() => router.push("/sponsor/slots")}
          style={{
            background: "transparent",
            color: "#6B6869",
            padding: "14px 0",
            borderRadius: 12,
            fontWeight: "normal",
            fontSize: 13,
            border: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          슬롯 추가 구매
        </button>
      </div>
    </div>
  );
}

export default function SponsorSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 48 }}>📰</div>
      </div>
    }>
      <SponsorSuccessContent />
    </Suspense>
  );
}
