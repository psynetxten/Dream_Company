"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ordersApi, OrderCreate, paymentApi } from "@/lib/api";

const DURATION_OPTIONS = [
  { days: 7,  label: "7일",  priceLabel: "무료",    desc: "체험 시리즈" },
  { days: 14, label: "14일", priceLabel: "17,900원", desc: "집중 시리즈" },
  { days: 30, label: "30일", priceLabel: "29,900원", desc: "완성 시리즈" },
] as const;

const FUTURE_YEARS = [2027, 2028, 2029, 2030, 2032, 2035];

/* ── 상단 진행 바 ── */
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 px-6 pt-4 pb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1 rounded-full transition-all duration-300"
          style={{ background: i < current ? "#1A1A1A" : "#E0DFD8" }}
        />
      ))}
    </div>
  );
}

export default function OrderForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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

  /* ─── 단계별 유효성 ─── */
  const canNext1 = form.dream_description.trim().length >= 10;
  const canNext2 = form.protagonist_name.trim().length >= 1 && form.target_role.trim().length >= 1;

  /* ─── 제출 ─── */
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const createRes = await ordersApi.create(form);
      const orderId = createRes.data.id;

      if (isFree) {
        await ordersApi.start(orderId);
        router.push(`/order/generating?orderId=${orderId}`);
        return;
      }

      const sessionRes = await paymentApi.createCheckoutSession(orderId);
      window.location.href = sessionRes.data.checkout_url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "의뢰 생성에 실패했습니다.");
      setLoading(false);
    }
  };

  /* ─────────── STEP 1: 꿈 입력 ─────────── */
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#F4F3EE] flex flex-col">
        <StepBar current={1} total={3} />

        <div className="px-6 pt-4 pb-2">
          <p className="text-xs font-bold text-[#AEAAA5] uppercase tracking-widest">1 / 3</p>
          <h1 className="font-headline font-bold text-2xl text-[#1A1A1A] mt-1 leading-tight">
            당신의 꿈을<br />들려주세요
          </h1>
          <p className="text-sm text-[#6B6869] mt-1">
            꿈신문사 기자단이 당신의 이야기를 신문으로 만듭니다
          </p>
        </div>

        <div className="flex-1 px-6 pt-4">
          <textarea
            value={form.dream_description}
            onChange={(e) => setForm({ ...form, dream_description: e.target.value })}
            placeholder="예: 구글 코리아의 AI 연구소장이 되어 세계적인 논문을 발표하고, 후배들을 이끄는 리더가 되고 싶습니다..."
            rows={7}
            className="app-input resize-none leading-relaxed"
            style={{ fontFamily: "inherit" }}
            autoFocus
          />
          <div className="flex justify-between mt-1.5 px-1">
            <span className="text-xs text-[#AEAAA5]">최소 10자 이상</span>
            <span className={`text-xs font-bold ${
              form.dream_description.length >= 10 ? "text-[#1A1A1A]" : "text-[#AEAAA5]"
            }`}>
              {form.dream_description.length}자
            </span>
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 space-y-3">
          <button
            onClick={() => setStep(2)}
            disabled={!canNext1}
            className="app-btn-primary disabled:opacity-40"
          >
            다음 →
          </button>
        </div>
      </div>
    );
  }

  /* ─────────── STEP 2: 주인공 정보 ─────────── */
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#F4F3EE] flex flex-col">
        <StepBar current={2} total={3} />

        <div className="px-6 pt-4 pb-2">
          <p className="text-xs font-bold text-[#AEAAA5] uppercase tracking-widest">2 / 3</p>
          <h1 className="font-headline font-bold text-2xl text-[#1A1A1A] mt-1 leading-tight">
            신문의 주인공은<br />누구인가요?
          </h1>
          <p className="text-sm text-[#6B6869] mt-1">기사에 실명으로 등장합니다</p>
        </div>

        <div className="flex-1 px-6 pt-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-[#6B6869] uppercase tracking-widest mb-1.5 block">이름 *</label>
            <input
              type="text"
              value={form.protagonist_name}
              onChange={(e) => setForm({ ...form, protagonist_name: e.target.value })}
              placeholder="홍길동"
              className="app-input"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#6B6869] uppercase tracking-widest mb-1.5 block">목표 역할 *</label>
            <input
              type="text"
              value={form.target_role}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              placeholder="예: AI 연구소장, 시리즈A 스타트업 대표"
              className="app-input"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#6B6869] uppercase tracking-widest mb-1.5 block">목표 회사 (선택)</label>
            <input
              type="text"
              value={form.target_company || ""}
              onChange={(e) => setForm({ ...form, target_company: e.target.value })}
              placeholder="예: 삼성전자, Google, 자체 스타트업"
              className="app-input"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#6B6869] uppercase tracking-widest mb-1.5 block">꿈이 이루어지는 해</label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {FUTURE_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setForm({ ...form, future_year: year })}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    form.future_year === year
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-white text-[#6B6869] border border-[#E0DFD8]"
                  }`}
                >
                  {year}년
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 space-y-3">
          <button
            onClick={() => setStep(3)}
            disabled={!canNext2}
            className="app-btn-primary disabled:opacity-40"
          >
            다음 →
          </button>
          <button
            onClick={() => setStep(1)}
            className="app-btn-secondary"
          >
            ← 이전
          </button>
        </div>
      </div>
    );
  }

  /* ─────────── STEP 3: 플랜 선택 ─────────── */
  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col">
      <StepBar current={3} total={3} />

      <div className="px-6 pt-4 pb-2">
        <p className="text-xs font-bold text-[#AEAAA5] uppercase tracking-widest">3 / 3</p>
        <h1 className="font-headline font-bold text-2xl text-[#1A1A1A] mt-1 leading-tight">
          어떻게<br />시작할까요?
        </h1>
      </div>

      <div className="flex-1 px-6 pt-4 space-y-3">
        {/* 무료 플랜 */}
        <button
          type="button"
          onClick={() => setForm({ ...form, payment_type: "free", duration_days: 7 })}
          className={`w-full app-card p-5 text-left transition-all ${
            isFree ? "ring-2 ring-[#1A1A1A]" : "active:bg-[#F2F1EB]"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="badge-active mb-2 inline-block">무료</span>
              <h3 className="font-headline font-bold text-[#1A1A1A] text-base">기자단 체험</h3>
              <p className="text-xs text-[#6B6869] mt-0.5">7일 시리즈 · 결제 없이 즉시 시작</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              isFree ? "border-[#1A1A1A] bg-[#1A1A1A]" : "border-[#E0DFD8]"
            }`}>
              {isFree && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <div className="flex gap-3 text-xs text-[#AEAAA5] mt-3">
            <span>✓ AI 기자단 작성</span>
            <span>✓ 매일 아침 발행</span>
            <span>✓ 스폰서 자동 매칭</span>
          </div>
        </button>

        {/* 프리미엄 플랜 */}
        <button
          type="button"
          onClick={() => setForm({ ...form, payment_type: "one_time", duration_days: form.duration_days === 7 ? 14 : form.duration_days })}
          className={`w-full app-card p-5 text-left transition-all ${
            !isFree ? "ring-2 ring-[#1A1A1A]" : "active:bg-[#F2F1EB]"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="bg-[#1A1A1A] text-white text-xs font-bold px-2.5 py-1 rounded-full mb-2 inline-block">프리미엄</span>
              <h3 className="font-headline font-bold text-[#1A1A1A] text-base">전담 기자 시리즈</h3>
              <p className="text-xs text-[#6B6869] mt-0.5">14일 / 30일 · 카드 결제</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              !isFree ? "border-[#1A1A1A] bg-[#1A1A1A]" : "border-[#E0DFD8]"
            }`}>
              {!isFree && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <div className="flex gap-3 text-xs text-[#AEAAA5] mt-3">
            <span>✓ 전담 기자 배정</span>
            <span>✓ 더 깊은 이야기</span>
            <span>✓ 우선 발행</span>
          </div>
        </button>

        {/* 기간 선택 (프리미엄만) */}
        {!isFree && (
          <div className="app-card p-4">
            <p className="text-xs font-bold text-[#6B6869] uppercase tracking-widest mb-3">시리즈 기간</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.filter((o) => o.days !== 7).map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setForm({ ...form, duration_days: opt.days })}
                  className={`p-3 rounded-xl text-center transition-all border ${
                    form.duration_days === opt.days
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A] border-[#E0DFD8]"
                  }`}
                >
                  <div className="font-headline font-bold text-base">{opt.label}</div>
                  <div className="text-xs mt-0.5 opacity-70">{opt.priceLabel}</div>
                  <div className="text-xs opacity-50">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-[#CC2200]">
            {error}
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="app-btn-primary disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              꿈을 준비하는 중...
            </span>
          ) : isFree ? "무료로 시작하기 🗞" : "결제하고 시작하기"}
        </button>
        <button onClick={() => setStep(2)} className="app-btn-secondary">
          ← 이전
        </button>
        <p className="text-center text-xs text-[#AEAAA5]">
          제출 후 내일 오전 8시부터 신문이 발행됩니다
        </p>
      </div>
    </div>
  );
}
