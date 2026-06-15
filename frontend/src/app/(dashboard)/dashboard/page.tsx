"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ordersApi, authApi, Order } from "@/lib/api";
import AppBar from "@/components/AppBar";
import { setRoleCookie, roleToHome } from "@/lib/auth";

const ROLES = [
  { value: "user", label: "일반 사용자", desc: "꿈 신문을 받아보고 싶어요" },
  { value: "writer", label: "기자단", desc: "꿈 신문을 직접 써보고 싶어요" },
  { value: "sponsor", label: "스폰서", desc: "기업으로 참여하고 싶어요" },
];

function SetupModal({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    setLoading(true);
    try {
      await authApi.updateMe({ full_name: name.trim(), role });
      setRoleCookie(role);
      router.replace(roleToHome(role));
      onComplete();
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ background: "#F4F3EE", borderRadius: 24, padding: "2rem 1.5rem", maxWidth: 400, width: "100%" }}>
        <p className="font-headline font-bold text-sm text-[#AEAAA5] mb-1">꿈신문사</p>
        <h2 className="font-headline font-bold text-2xl text-[#1A1A1A] mb-1">반갑습니다!</h2>
        <p className="text-sm text-[#6B6869] mb-6">이름과 역할을 알려주세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            required
            className="app-input"
            autoFocus
          />

          <div className="space-y-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{
                  width: "100%", textAlign: "left", padding: "0.875rem 1rem",
                  borderRadius: 14, border: `2px solid ${role === r.value ? "#1A1A1A" : "#E0DFD8"}`,
                  background: role === r.value ? "#1A1A1A" : "#fff",
                  color: role === r.value ? "#fff" : "#1A1A1A",
                  transition: "all 0.15s",
                }}
              >
                <p className="font-bold text-sm">{r.label}</p>
                <p style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>{r.desc}</p>
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-[#CC2200]">{error}</p>}

          <button type="submit" disabled={loading} className="app-btn-primary disabled:opacity-50 mt-2">
            {loading ? "저장 중..." : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="app-card p-5 space-y-3">
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-2 w-full mt-2" />
      <div className="skeleton h-10 w-full rounded-xl mt-1" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <span className="badge-active">연재 중</span>;
  if (status === "draft") return <span className="badge-draft">준비 중</span>;
  if (status === "paused") return <span className="badge-draft">일시 중지</span>;
  return <span className="badge-done">{status === "completed" ? "완료" : status === "cancelled" ? "취소됨" : status}</span>;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    authApi.me().then((res) => {
      const name = res.data?.full_name;
      if (!name || name === "꿈 참여자") setShowSetup(true);
    }).catch(() => {});

    ordersApi
      .list()
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter((o) => ["active", "draft", "paused"].includes(o.status));
  const doneOrders = orders.filter((o) => ["completed", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      {showSetup && <SetupModal onComplete={() => setShowSetup(false)} />}
      <AppBar title="내 꿈 시리즈" showBack backHref="/" />

      <div className="pt-safe-header pb-safe-nav px-4 space-y-6 max-w-lg mx-auto">
        {/* 새 의뢰 버튼 + 크레딧 링크 */}
        <div className="pt-4 space-y-2">
          <Link href="/order/new" className="app-btn-primary">
            + 새 꿈 의뢰하기
          </Link>
          <Link
            href="/credits"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
              fontSize: 13,
              color: "#6B6869",
              textDecoration: "none",
            }}
          >
            <span>💳</span> 크레딧 충전 · 내역 보기
          </Link>
        </div>

        {/* 진행 중 */}
        <section>
          <p className="app-section-label mb-3">진행 중</p>

          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="app-card p-8 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#F2F1EB] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="#AEAAA5" strokeWidth="1.8"/>
                  <line x1="7" y1="9" x2="17" y2="9" stroke="#AEAAA5" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="7" y1="13" x2="13" y2="13" stroke="#AEAAA5" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="font-headline font-bold text-[#1A1A1A]">아직 진행 중인 시리즈가 없어요</p>
                <p className="text-sm text-[#6B6869] mt-1">첫 번째 꿈을 의뢰하면<br />내일 아침부터 신문이 시작됩니다</p>
              </div>
              <Link href="/order/new" className="app-btn-primary mt-2" style={{ maxWidth: 200 }}>
                꿈 의뢰하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => {
                const progress = order.duration_days > 0
                  ? Math.round((order.published_newspapers / order.duration_days) * 100)
                  : 0;
                const remaining = order.duration_days - order.published_newspapers;

                return (
                  <div key={order.id} className="app-card p-5">
                    {/* 상단: 뱃지 + D-N */}
                    <div className="flex items-center justify-between mb-3">
                      <StatusBadge status={order.status} />
                      {order.status === "active" && (
                        <span className="text-[#CC2200] text-xs font-bold">
                          D-{remaining}
                        </span>
                      )}
                    </div>

                    {/* 제목 */}
                    <h2 className="font-headline font-bold text-[#1A1A1A] text-base leading-snug">
                      {order.protagonist_name}의 꿈
                    </h2>
                    <p className="text-xs text-[#6B6869] mt-0.5 truncate">
                      {order.target_role}
                      {order.target_company && ` @ ${order.target_company}`}
                    </p>

                    {/* 설명 */}
                    {order.dream_description && (
                      <p className="text-xs text-[#AEAAA5] mt-2 line-clamp-2 leading-relaxed">
                        {order.dream_description}
                      </p>
                    )}

                    {/* 진행률 바 */}
                    <div className="mt-4 mb-4">
                      <div className="flex justify-between text-[10px] text-[#AEAAA5] mb-1.5">
                        <span>{order.published_newspapers}편 발행 / {order.duration_days}일 시리즈</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F2F1EB] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: progress >= 100
                              ? "#22C55E"
                              : progress >= 50
                              ? "#1A1A1A"
                              : "#CC2200",
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/newspapers/${order.id}`}
                      className="app-btn-primary"
                      style={{ fontSize: 14, minHeight: 48 }}
                    >
                      신문 보기
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 완료된 시리즈 */}
        {!loading && doneOrders.length > 0 && (
          <section>
            <p className="app-section-label mb-3">완료된 시리즈</p>
            <div className="space-y-3">
              {doneOrders.map((order) => (
                <div key={order.id} className="app-card p-4 opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={order.status} />
                    <span className="text-[10px] text-[#AEAAA5]">{order.duration_days}일 시리즈</span>
                  </div>
                  <h3 className="font-headline font-bold text-[#1A1A1A] text-sm">
                    {order.protagonist_name}의 꿈
                  </h3>
                  <p className="text-xs text-[#6B6869] mt-0.5 truncate">{order.target_role}</p>
                  <Link
                    href={`/newspapers/${order.id}`}
                    className="mt-3 text-xs font-bold text-[#6B6869] underline"
                  >
                    신문 다시 보기
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
