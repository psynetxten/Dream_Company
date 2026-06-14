"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppBar from "@/components/AppBar";
import { creditsApi, CreditPackage, CreditTransaction } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  purchase: "충전",
  consume: "사용",
  bonus: "보너스",
  refund: "환불",
};

const TYPE_COLOR: Record<string, string> = {
  purchase: "#5BB974",
  consume: "#CC2200",
  bonus: "#F5A623",
  refund: "#6B6869",
};

export default function CreditsPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([creditsApi.getBalance(), creditsApi.listPackages()])
      .then(([balRes, pkgRes]) => {
        setBalance(balRes.data.credits);
        setTransactions(balRes.data.transactions);
        setPackages(pkgRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const res = await creditsApi.createCheckout(packageId);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      console.error(err);
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <AppBar title="크레딧" showBack backHref="/dashboard" />

      <div className="pt-safe-header pb-safe-nav px-4 max-w-lg mx-auto space-y-6 pt-6">

        {/* 잔액 카드 */}
        <div
          style={{
            background: "#1A1A1A",
            borderRadius: 16,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: "#6B6869", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            보유 크레딧
          </p>
          {loading ? (
            <div style={{ height: 44, background: "#2A2A2A", borderRadius: 8, marginTop: 4 }} />
          ) : (
            <p style={{ margin: 0, fontSize: 40, fontWeight: "bold", color: "#F5F0E8", fontFamily: "Georgia, serif" }}>
              {balance?.toLocaleString() ?? 0}
              <span style={{ fontSize: 16, color: "#6B6869", marginLeft: 6 }}>크레딧</span>
            </p>
          )}
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#3A3A3A" }}>
            1 크레딧 = 신문 1편
          </p>
        </div>

        {/* 크레딧 팩 구매 */}
        <div>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: "bold", color: "#1A1A1A" }}>
            크레딧 충전
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 80, background: "#E0DFD8", borderRadius: 12 }} />
                ))
              : packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    disabled={!!purchasing}
                    onClick={() => handlePurchase(pkg.id)}
                    style={{
                      background: "#fff",
                      border: purchasing === pkg.id ? "2px solid #CC2200" : "1px solid #E0DFD8",
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: purchasing ? "not-allowed" : "pointer",
                      opacity: purchasing && purchasing !== pkg.id ? 0.5 : 1,
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: "bold", color: "#1A1A1A", fontFamily: "Georgia, serif" }}>
                          {pkg.credits.toLocaleString()}크레딧
                        </span>
                        {pkg.id === "popular" && (
                          <span style={{
                            fontSize: 9,
                            background: "#CC2200",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: 20,
                            fontWeight: "bold",
                            letterSpacing: "0.1em",
                          }}>
                            인기
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B6869" }}>
                        편당 {pkg.per_credit}원
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: "bold", color: "#1A1A1A" }}>
                        {pkg.price_krw.toLocaleString()}원
                      </p>
                      {purchasing === pkg.id && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#CC2200" }}>결제 중...</p>
                      )}
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* 거래 내역 */}
        <div>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: "bold", color: "#1A1A1A" }}>
            거래 내역
          </p>
          {loading ? (
            <div style={{ height: 60, background: "#E0DFD8", borderRadius: 12 }} />
          ) : transactions.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6B6869", textAlign: "center", padding: "24px 0" }}>
              아직 거래 내역이 없습니다.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    background: "#fff",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 0,
                  }}
                  className="first:rounded-t-xl last:rounded-b-xl"
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "#1A1A1A" }}>{tx.description}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#AEAAA5" }}>
                      {new Date(tx.created_at).toLocaleDateString("ko-KR", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: "bold",
                      color: TYPE_COLOR[tx.type] || "#1A1A1A",
                    }}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: 10, color: "#AEAAA5" }}>
                      → {tx.credits_after}크레딧
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
