"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ordersApi, Order } from "@/lib/api";
import AppBar from "@/components/AppBar";

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

  useEffect(() => {
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
