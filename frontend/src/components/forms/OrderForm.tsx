"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ordersApi, OrderCreate } from "@/lib/api";

const DURATION_OPTIONS = [
  { days: 7, label: "7일", price: "9,900원", desc: "체험 시리즈" },
  { days: 14, label: "14일", price: "17,900원", desc: "집중 시리즈" },
  { days: 30, label: "30일", price: "29,900원", desc: "완성 시리즈" },
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
    payment_type: "one_time",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const createRes = await ordersApi.create(form);
      const orderId = createRes.data.id;

      // 바로 시작 (MVP: 결제 생략)
      await ordersApi.start(orderId);

      router.push(`/dashboard`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "의뢰 생성에 실패했습니다.");
    } finally {
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
            당신의 꿈을 알려주세요. AI 기자단이 신문으로 만들어 드립니다.
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
              입력하면 해당 기업이 스폰서로 연결됩니다.
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

          {/* 시리즈 선택 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3">
              시리즈 기간 선택 *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setForm({ ...form, duration_days: opt.days })}
                  className={`border-2 p-3 text-center transition-colors ${
                    form.duration_days === opt.days
                      ? "border-ink bg-ink text-newsprint-50"
                      : "border-ink bg-newsprint-100 hover:bg-newsprint-200"
                  }`}
                >
                  <div className="font-bold text-xl">{opt.label}</div>
                  <div className="text-xs mt-1 opacity-80">{opt.price}</div>
                  <div className="text-xs opacity-60">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 결제 유형 */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3">
              결제 방식
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, payment_type: "one_time" })}
                className={`border-2 p-3 text-center transition-colors ${
                  form.payment_type === "one_time"
                    ? "border-ink bg-ink text-newsprint-50"
                    : "border-ink bg-newsprint-100"
                }`}
              >
                <div className="font-bold">일회성 구매</div>
                <div className="text-xs opacity-70">선택한 기간만큼</div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, payment_type: "subscription" })}
                className={`border-2 p-3 text-center transition-colors ${
                  form.payment_type === "subscription"
                    ? "border-ink bg-ink text-newsprint-50"
                    : "border-ink bg-newsprint-100"
                }`}
              >
                <div className="font-bold">구독</div>
                <div className="text-xs opacity-70">자동 갱신 · 할인 적용</div>
              </button>
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
            {loading ? "꿈을 준비하는 중..." : "꿈신문 시작하기"}
          </button>

          <p className="text-xs text-center text-ink-muted">
            제출하면 내일 오전 8시부터 꿈신문이 발행됩니다.
          </p>
        </div>
      </div>
    </form>
  );
}
