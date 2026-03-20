"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ordersApi, OrderCreate, paymentApi } from "@/lib/api";

declare global {
  interface Window {
    IMP: any;
  }
}

const DURATION_OPTIONS = [
  { days: 7, label: "7일", price: 9900, priceLabel: "9,900원", desc: "체험 시리즈" },
  { days: 14, label: "14일", price: 17900, priceLabel: "17,900원", desc: "집중 시리즈" },
  { days: 30, label: "30일", price: 29900, priceLabel: "29,900원", desc: "완성 시리즈" },
] as const;

export default function OrderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OrderCreate>({
    dream_description: "",
    protagonist_name: "",
    target_role: "",
    target_company: "",
    duration_days: 7,
    future_year: 2030,
    payment_type: "free",
  });

  const isFree = form.payment_type === "free";

  // 무료 선택 시 기간을 7일로 고정
  const handlePlanChange = (type: "free" | "one_time" | "subscription") => {
    setForm({ ...form, payment_type: type, duration_days: type === "free" ? 7 : form.duration_days });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. 주문 생성
      const createRes = await ordersApi.create(form);
      const orderId = createRes.data.id;

      // 2. 무료 주문 — 결제 없이 바로 시작
      if (isFree) {
        await ordersApi.start(orderId);
        router.push("/dashboard");
        return;
      }

      // 3. 유료 주문 — Portone 결제창 호출
      const amount = DURATION_OPTIONS.find(o => o.days === form.duration_days)?.price || 0;
      const { IMP } = window;
      if (!IMP) {
        throw new Error("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }

      IMP.init(process.env.NEXT_PUBLIC_PORTONE_ID || "imp00000000");

      IMP.request_pay({
        pg: "html5_inicis",
        pay_method: "card",
        merchant_uid: orderId,
        name: `꿈신문사 ${form.duration_days}일 시리즈`,
        amount: amount,
        buyer_email: "",
        buyer_name: form.protagonist_name,
      }, async (rsp: any) => {
        if (rsp.success) {
          try {
            await paymentApi.verify(rsp.imp_uid, rsp.merchant_uid);
            await ordersApi.start(orderId);
            router.push("/dashboard");
          } catch (err) {
            setError("결제 검증에 실패했습니다. 고객센터에 문의해주세요.");
          }
        } else {
          setError(`결제에 실패했습니다: ${rsp.error_msg}`);
          setLoading(false);
        }
      });

    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(error.response?.data?.detail || error.message || "의뢰 생성에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="newspaper-page p-8">
        {/* 폼 헤더 */}
        <div className="text-center border-b-2 border-ink pb-4 mb-8">
          <h1 className="font-headline text-3xl font-bold">꿈 의뢰서</h1>
          <p className="text-sm text-ink-muted mt-1">
            당신의 꿈을 알려주세요. 꿈신문사 기자단이 신문으로 만들어 드립니다.
          </p>
        </div>

        <div className="space-y-6">
          {/* 주인공 이름 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              신문에 등장할 이름 *
            </label>
            <input
              type="text"
              value={form.protagonist_name}
              onChange={(e) => setForm({ ...form, protagonist_name: e.target.value })}
              placeholder="홍길동"
              required
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif text-ink focus:outline-none focus:border-ink-light"
            />
            <p className="text-xs text-ink-muted mt-1">
              신문 기사에 실명으로 등장합니다.
            </p>
          </div>

          {/* 꿈 설명 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              당신의 꿈 *
            </label>
            <textarea
              value={form.dream_description}
              onChange={(e) => setForm({ ...form, dream_description: e.target.value })}
              placeholder="예: 삼성전자에서 AI 연구소장이 되어 세계적인 논문을 발표하고 싶습니다. 팀을 이끌며 한국 AI 기술을 세계 최고 수준으로 끌어올리는 것이 목표입니다."
              required
              rows={4}
              minLength={10}
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif text-ink focus:outline-none focus:border-ink-light resize-none"
            />
          </div>

          {/* 목표 직업 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              목표 직업/역할 *
            </label>
            <input
              type="text"
              value={form.target_role}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              placeholder="예: AI 연구소장, 시리즈A 스타트업 대표, 올림픽 피아니스트"
              required
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif text-ink focus:outline-none focus:border-ink-light"
            />
          </div>

          {/* 목표 회사 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              목표 회사 (선택)
            </label>
            <input
              type="text"
              value={form.target_company || ""}
              onChange={(e) => setForm({ ...form, target_company: e.target.value })}
              placeholder="예: 삼성전자, 카카오, Google, 자체 스타트업"
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif text-ink focus:outline-none focus:border-ink-light"
            />
            <p className="text-xs text-ink-muted mt-1">
              입력하면 해당 기업이 기사에 자연스럽게 등장합니다.
            </p>
          </div>

          {/* 미래 연도 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              꿈이 이루어지는 연도
            </label>
            <select
              value={form.future_year}
              onChange={(e) => setForm({ ...form, future_year: Number(e.target.value) })}
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif text-ink focus:outline-none"
            >
              {[2027, 2028, 2029, 2030, 2032, 2035].map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </div>

          {/* 구분선 */}
          <hr className="news-divider" />

          {/* 플랜 선택 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3">
              플랜 선택 *
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => handlePlanChange("free")}
                className={`border-2 p-4 text-center transition-colors ${isFree
                  ? "border-ink bg-ink text-newsprint-50"
                  : "border-ink bg-newsprint-100 hover:bg-newsprint-200"
                }`}
              >
                <div className="font-bold text-lg">무료</div>
                <div className="text-xs mt-1 opacity-80">기자단이 씁니다 · 7일</div>
              </button>
              <div className="border-2 border-newsprint-300 bg-newsprint-100 p-4 text-center opacity-50 cursor-not-allowed">
                <div className="font-bold text-lg text-ink-muted">프리미엄</div>
                <div className="text-xs mt-1 text-ink-muted">전담 기자 배정 · 준비 중</div>
              </div>
            </div>
          </div>

          {/* 시리즈 기간 선택 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3">
              시리즈 기간 선택 *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DURATION_OPTIONS.map((opt) => {
                const locked = isFree && opt.days !== 7;
                const selected = form.duration_days === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setForm({ ...form, duration_days: opt.days })}
                    className={`border-2 p-3 text-center transition-colors relative ${
                      locked
                        ? "border-newsprint-300 bg-newsprint-100 opacity-40 cursor-not-allowed"
                        : selected
                        ? "border-ink bg-ink text-newsprint-50"
                        : "border-ink bg-newsprint-100 hover:bg-newsprint-200"
                    }`}
                  >
                    <div className="font-bold text-xl">{opt.label}</div>
                    {locked && (
                      <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5 text-ink-muted">프리미엄</div>
                    )}
                    {!locked && !isFree && (
                      <div className="text-xs mt-1 opacity-80">{opt.priceLabel}</div>
                    )}
                    {!locked && (
                      <div className="text-xs opacity-60 mt-0.5">{opt.desc}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="border-2 border-red-500 bg-red-50 p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-newsprint-50 py-4 font-bold text-lg tracking-widest uppercase hover:bg-ink-light transition-colors disabled:opacity-50"
          >
            {loading ? "꿈을 준비하는 중..." : isFree ? "무료로 시작하기" : "결제하고 시작하기"}
          </button>

          <p className="text-xs text-center text-ink-muted">
            제출하면 내일 오전 8시부터 꿈신문이 발행됩니다.
          </p>
        </div>
      </div>
    </form>
  );
}
