"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { creditsApi } from "@/lib/api";

function CreditSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/credits");
      return;
    }
    // 잠시 후 잔액 조회 (웹훅 처리 시간 여유)
    const timer = setTimeout(() => {
      creditsApi
        .getBalance()
        .then((res) => setCredits(res.data.credits))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 1500);
    return () => clearTimeout(timer);
  }, [sessionId, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0F0F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        gap: 24,
      }}
    >
      <div style={{ fontSize: 56 }}>🎉</div>

      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "#CC2200", letterSpacing: "0.3em", fontWeight: "bold" }}>
          충전 완료
        </p>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: "bold", color: "#F5F0E8", fontFamily: "Georgia, serif" }}>
          크레딧이 추가됐습니다
        </h2>
      </div>

      {loading ? (
        <div style={{ height: 56, width: 160, background: "#2A2A2A", borderRadius: 12 }} />
      ) : (
        <div
          style={{
            background: "#1A1A1A",
            borderRadius: 16,
            padding: "20px 40px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 40, fontWeight: "bold", color: "#F5F0E8", fontFamily: "Georgia, serif" }}>
            {credits?.toLocaleString() ?? "—"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B6869" }}>보유 크레딧</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
        <button
          onClick={() => router.push("/order/new")}
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
          새 꿈 의뢰하기 →
        </button>
        <button
          onClick={() => router.push("/credits")}
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
          크레딧 내역 보기
        </button>
      </div>
    </div>
  );
}

export default function CreditSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 48 }}>💳</div>
      </div>
    }>
      <CreditSuccessContent />
    </Suspense>
  );
}
