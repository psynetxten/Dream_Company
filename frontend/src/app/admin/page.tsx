"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserRole, signOut } from "@/lib/auth";
import { adminApi } from "@/lib/api";

interface Overview {
  user_count: number;
  users_today: number;
  order_count: number;
  orders_today: number;
  newspaper_count: number;
  published_today: number;
  failed_today: number;
  pending_today: number;
  new_inquiries: number;
  sponsor_count: number;
}

interface Inquiry {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

interface ScheduleHealth {
  upcoming_pending: number;
  overdue_pending: number;
  recent_failures: {
    id: string;
    order_id: string;
    episode_number: number;
    error_message: string | null;
    executed_at: string | null;
    retry_count: number;
  }[];
  tokens_today: { input: number; output: number; papers: number; cost_krw: number };
  tokens_week: { input: number; output: number; papers: number; cost_krw: number };
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  roles: string[];
  credits: number;
  is_active: boolean;
  created_at: string | null;
}

interface OrderRow {
  id: string;
  user_email: string;
  protagonist_name: string;
  target_role: string;
  duration_days: number;
  payment_type: string;
  payment_status: string;
  status: string;
  newspaper_count: number;
  created_at: string | null;
}

interface Finance {
  revenue: { today: number; this_month: number; all_time: number; paid_orders: number };
  cost_this_month: { token_cost_krw: number; infra_cost_krw: number; total_krw: number };
  net_profit_this_month: number;
  note: string;
}

interface InfraCostRow {
  service: string;
  monthly_cost_krw: number;
  note: string | null;
  updated_at: string;
}

const SERVICE_LABEL: Record<string, string> = {
  render: "Render (백엔드)",
  vercel: "Vercel (프론트)",
  supabase: "Supabase (DB)",
  resend: "Resend (이메일)",
};

const STATUS_LABEL: Record<string, string> = { new: "신규", contacted: "연락함", closed: "종료" };

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [health, setHealth] = useState<ScheduleHealth | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [finance, setFinance] = useState<Finance | null>(null);
  const [infraCosts, setInfraCosts] = useState<InfraCostRow[]>([]);
  const [editingCost, setEditingCost] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login?next=/admin");
        return;
      }
      const role = await getUserRole();
      if (role !== "admin") {
        router.replace("/");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  const loadAll = useCallback(async () => {
    try {
      const [ov, inq, sh, fin, costs] = await Promise.all([
        adminApi.overview(),
        adminApi.inquiries(),
        adminApi.scheduleHealth(),
        adminApi.finance(),
        adminApi.infraCosts(),
      ]);
      setOverview(ov.data);
      setInquiries(inq.data);
      setHealth(sh.data);
      setFinance(fin.data);
      setInfraCosts(costs.data);
    } catch {
      setError("데이터를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    if (!checking) loadAll();
  }, [checking, loadAll]);

  const handleInquiryStatus = async (id: string, status: string) => {
    await adminApi.updateInquiryStatus(id, status);
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const handleUserSearch = async () => {
    const res = await adminApi.searchUsers(userQuery);
    setUsers(res.data);
  };

  const handleOrderSearch = async () => {
    const res = await adminApi.searchOrders(orderQuery);
    setOrders(res.data);
  };

  const handleSaveInfraCost = async (service: string) => {
    const raw = editingCost[service];
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) return;
    await adminApi.updateInfraCost(service, value);
    setInfraCosts((prev) =>
      prev.map((c) => (c.service === service ? { ...c, monthly_cost_krw: value } : c))
    );
    const fin = await adminApi.finance();
    setFinance(fin.data);
  };

  if (checking) {
    return (
      <div className="min-h-dvh bg-[#F4F3EE] flex items-center justify-center">
        <div className="skeleton h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F3EE] px-5 pt-safe-top pb-24">
      <div className="max-w-3xl mx-auto w-full">
        {/* 헤더 */}
        <div className="pt-8 pb-6 flex items-center justify-between">
          <div>
            <p className="font-headline font-bold text-sm text-[#AEAAA5] mb-1">꿈신문사 편집국</p>
            <h1 className="font-headline font-bold text-2xl text-[#1A1A1A]">관리자 대시보드</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="text-xs font-bold text-[#AEAAA5] border border-[#E0DFD8] rounded-full px-3 py-1.5"
          >
            로그아웃
          </button>
        </div>

        {error && <p className="text-sm text-[#CC2200] mb-4">{error}</p>}

        {/* 1. 오늘의 현황 */}
        <section className="mb-8">
          <h2 className="app-section-label mb-3">오늘의 현황</h2>
          {overview ? (
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="전체 유저" value={overview.user_count} sub={`오늘 +${overview.users_today}`} />
              <StatCard label="전체 주문" value={overview.order_count} sub={`오늘 +${overview.orders_today}`} />
              <StatCard label="발행된 신문" value={overview.newspaper_count} />
              <StatCard label="스폰서" value={overview.sponsor_count} />
              <StatCard
                label="오늘 발행 성공"
                value={overview.published_today}
                accent={overview.failed_today > 0 ? "warn" : "ok"}
              />
              <StatCard
                label="오늘 발행 실패"
                value={overview.failed_today}
                accent={overview.failed_today > 0 ? "danger" : undefined}
              />
              <StatCard label="오늘 발행 대기중" value={overview.pending_today} />
              <StatCard
                label="새 제휴 문의"
                value={overview.new_inquiries}
                accent={overview.new_inquiries > 0 ? "warn" : undefined}
              />
            </div>
          ) : (
            <div className="skeleton h-24" />
          )}
        </section>

        {/* 1.5. 매출 · 손익 */}
        <section className="mb-8">
          <h2 className="app-section-label mb-3">매출 · 손익</h2>
          {finance ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="이번 달 매출" value={finance.revenue.this_month} unit="원" />
                <StatCard label="누적 매출" value={finance.revenue.all_time} unit="원" />
                <StatCard label="이번 달 비용" value={finance.cost_this_month.total_krw} unit="원" />
                <StatCard
                  label="이번 달 순이익"
                  value={finance.net_profit_this_month}
                  unit="원"
                  accent={finance.net_profit_this_month < 0 ? "danger" : finance.net_profit_this_month > 0 ? "ok" : undefined}
                />
              </div>
              {finance.revenue.all_time === 0 && (
                <p className="text-xs text-[#AEAAA5] px-1">{finance.note}</p>
              )}
              <div className="app-card p-4">
                <p className="text-xs font-bold text-[#6B6869] mb-2">인프라 구독비 (월, 수동 입력)</p>
                <div className="space-y-2.5">
                  {infraCosts.map((c) => (
                    <div key={c.service} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1A1A1A]">{SERVICE_LABEL[c.service] || c.service}</p>
                        {c.note && <p className="text-[10px] text-[#AEAAA5] truncate">{c.note}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          className="w-24 text-right text-sm border border-[#E0DFD8] rounded-lg px-2 py-1"
                          defaultValue={c.monthly_cost_krw}
                          onChange={(e) => setEditingCost((prev) => ({ ...prev, [c.service]: e.target.value }))}
                        />
                        <button
                          onClick={() => handleSaveInfraCost(c.service)}
                          className="text-xs font-bold text-white bg-[#1A1A1A] rounded-lg px-2.5 py-1.5"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="skeleton h-24" />
          )}
        </section>

        {/* 2. 스폰서 제휴 문의 */}
        <section className="mb-8">
          <h2 className="app-section-label mb-3">스폰서 제휴 문의</h2>
          {inquiries.length === 0 ? (
            <p className="text-sm text-[#AEAAA5] app-card p-4">아직 문의가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {inquiries.map((inq) => (
                <div key={inq.id} className="app-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[#1A1A1A] text-sm truncate">{inq.company_name}</p>
                      <p className="text-xs text-[#6B6869] mt-0.5">
                        {inq.contact_name} · {inq.email}{inq.phone ? ` · ${inq.phone}` : ""}
                      </p>
                      {inq.message && (
                        <p className="text-xs text-[#6B6869] mt-1.5 leading-relaxed">{inq.message}</p>
                      )}
                      <p className="text-[10px] text-[#AEAAA5] mt-1.5">
                        {new Date(inq.created_at).toLocaleString("ko-KR")}
                      </p>
                    </div>
                    <select
                      value={inq.status}
                      onChange={(e) => handleInquiryStatus(inq.id, e.target.value)}
                      className={`text-xs font-bold rounded-full px-2.5 py-1 border shrink-0 ${
                        inq.status === "new"
                          ? "bg-[#FFF6E0] text-[#8A6300] border-[#F0DFA8]"
                          : inq.status === "contacted"
                          ? "bg-[#E8F0FE] text-[#1A4B8C] border-[#C7DBF5]"
                          : "bg-[#F2F1EB] text-[#6B6869] border-[#E0DFD8]"
                      }`}
                    >
                      <option value="new">{STATUS_LABEL.new}</option>
                      <option value="contacted">{STATUS_LABEL.contacted}</option>
                      <option value="closed">{STATUS_LABEL.closed}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. 발행 스케줄 · 토큰비용 모니터링 */}
        <section className="mb-8">
          <h2 className="app-section-label mb-3">발행 스케줄 · 비용</h2>
          {health ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="예정된 발행" value={health.upcoming_pending} />
                <StatCard
                  label="지연된 발행"
                  value={health.overdue_pending}
                  accent={health.overdue_pending > 0 ? "danger" : "ok"}
                />
              </div>
              <div className="app-card p-4">
                <p className="text-xs font-bold text-[#6B6869] mb-2">토큰 비용 (추정)</p>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6869]">오늘 {health.tokens_today.papers}편</span>
                  <span className="font-bold text-[#1A1A1A]">{health.tokens_today.cost_krw.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-[#6B6869]">최근 7일 {health.tokens_week.papers}편</span>
                  <span className="font-bold text-[#1A1A1A]">{health.tokens_week.cost_krw.toLocaleString()}원</span>
                </div>
              </div>
              {health.recent_failures.length > 0 && (
                <div className="app-card p-4">
                  <p className="text-xs font-bold text-[#CC2200] mb-2">최근 발행 실패</p>
                  <div className="space-y-2">
                    {health.recent_failures.map((f) => (
                      <div key={f.id} className="text-xs text-[#6B6869] border-b border-[#F0EFEA] pb-2 last:border-0">
                        <p>주문 {f.order_id.slice(0, 8)} · {f.episode_number}화 · 재시도 {f.retry_count}회</p>
                        {f.error_message && <p className="text-[#AEAAA5] mt-0.5 truncate">{f.error_message}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="skeleton h-24" />
          )}
        </section>

        {/* 4. 유저/주문 검색 (CS) */}
        <section className="mb-8">
          <h2 className="app-section-label mb-3">유저 검색 (CS)</h2>
          <div className="flex gap-2 mb-3">
            <input
              className="app-input flex-1"
              placeholder="이메일 또는 이름"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
            />
            <button onClick={handleUserSearch} className="px-5 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm">검색</button>
          </div>
          {users.length > 0 && (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="app-card p-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-bold text-[#1A1A1A] truncate">{u.email}</p>
                    <p className="text-xs text-[#6B6869]">{u.full_name} · {u.roles.join(", ")} · 크레딧 {u.credits}</p>
                  </div>
                  {!u.is_active && <span className="text-xs text-[#CC2200] shrink-0">비활성</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="app-section-label mb-3">주문 검색 (CS)</h2>
          <div className="flex gap-2 mb-3">
            <input
              className="app-input flex-1"
              placeholder="주인공명 또는 유저 이메일"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOrderSearch()}
            />
            <button onClick={handleOrderSearch} className="px-5 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm">검색</button>
          </div>
          {orders.length > 0 && (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="app-card p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#1A1A1A]">{o.protagonist_name} · {o.target_role}</p>
                    <span className="text-xs text-[#6B6869]">{o.status}</span>
                  </div>
                  <p className="text-xs text-[#6B6869] mt-0.5">
                    {o.user_email} · {o.duration_days}일 · {o.payment_type}/{o.payment_status} · 신문 {o.newspaper_count}편
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  unit,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  unit?: string;
  accent?: "ok" | "warn" | "danger";
}) {
  const color =
    accent === "danger" ? "text-[#CC2200]" : accent === "warn" ? "text-[#8A6300]" : accent === "ok" ? "text-[#1A7A4C]" : "text-[#1A1A1A]";
  return (
    <div className="app-card p-4">
      <p className="text-xs font-bold text-[#6B6869] mb-1">{label}</p>
      <p className={`text-2xl font-headline font-bold ${color}`}>{value.toLocaleString()}{unit ? <span className="text-sm ml-0.5">{unit}</span> : ""}</p>
      {sub && <p className="text-[10px] text-[#AEAAA5] mt-0.5">{sub}</p>}
    </div>
  );
}
