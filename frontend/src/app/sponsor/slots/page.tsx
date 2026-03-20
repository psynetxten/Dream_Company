"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sponsorApi, SlotCreate } from "@/lib/api";

const SLOT_TYPES = [
  {
    type: "company_name" as const,
    label: "기업명 슬롯",
    desc: "기사 본문에 기업명이 자연스럽게 등장합니다. 예: '김지우는 삼성전자 면접을 통과했다.'",
    example: "예: 삼성전자",
  },
  {
    type: "brand_name" as const,
    label: "브랜드 슬롯",
    desc: "제품/서비스 브랜드명이 기사에 삽입됩니다. 예: '갤럭시 S30으로 인터뷰 준비를 완료했다.'",
    example: "예: 갤럭시 S30",
  },
  {
    type: "banner" as const,
    label: "배너 슬롯",
    desc: "신문 상단 또는 하단에 기업 메시지가 배치됩니다.",
    example: "예: 함께 성장하는 미래, 삼성전자",
  },
  {
    type: "sidebar" as const,
    label: "사이드바 슬롯",
    desc: "신문 우측 사이드바에 기업 정보 카드가 표시됩니다.",
    example: "예: 지금 삼성전자 채용 진행 중",
  },
];

export default function SponsorSlotsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<typeof SLOT_TYPES[0] | null>(null);
  const [form, setForm] = useState<SlotCreate>({
    slot_type: "company_name",
    variable_value: "",
    purchased_quantity: 10,
  });

  const handleSelect = (slot: typeof SLOT_TYPES[0]) => {
    setSelected(slot);
    setForm((f) => ({ ...f, slot_type: slot.type, variable_value: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.variable_value) { setError("삽입할 텍스트를 입력하세요."); return; }
    setLoading(true);
    setError("");
    try {
      await sponsorApi.purchaseSlot(form);
      setSuccess(`슬롯 ${form.purchased_quantity}개가 활성화되었습니다!`);
      setTimeout(() => router.push("/sponsor/dashboard"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "슬롯 구매 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-newsprint-50 text-ink p-8">
      <header className="max-w-3xl mx-auto border-b-4 border-ink pb-6 mb-12">
        <h1 className="font-headline text-5xl font-bold uppercase tracking-tighter">광고 슬롯 구매</h1>
        <p className="text-sm text-ink-muted mt-2 italic">독자의 꿈 기사에 브랜드를 자연스럽게 삽입합니다. 현재 무료 제공 중.</p>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* 슬롯 타입 선택 */}
        <section>
          <h2 className="font-headline text-xl font-bold mb-4">슬롯 유형 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SLOT_TYPES.map((slot) => (
              <button
                key={slot.type}
                type="button"
                onClick={() => handleSelect(slot)}
                className={`text-left border-2 p-4 transition-all ${
                  selected?.type === slot.type
                    ? "border-ink bg-ink text-newsprint-50"
                    : "border-ink/40 hover:border-ink bg-newsprint-100"
                }`}
              >
                <div className="font-headline font-bold text-lg mb-1">{slot.label}</div>
                <div className={`text-xs mb-2 ${selected?.type === slot.type ? "text-newsprint-200" : "text-ink-muted"}`}>{slot.desc}</div>
                <div className={`text-xs italic ${selected?.type === slot.type ? "text-newsprint-300" : "text-ink/50"}`}>{slot.example}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 슬롯 설정 */}
        {selected && (
          <form onSubmit={handleSubmit} className="border-2 border-ink p-6 space-y-6">
            <h2 className="font-headline text-xl font-bold border-b border-ink pb-2">{selected.label} 설정</h2>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">삽입할 텍스트 *</label>
              <input
                className="w-full border-2 border-ink p-3 bg-newsprint-100 font-serif text-lg focus:outline-none focus:bg-white"
                value={form.variable_value}
                onChange={(e) => setForm({ ...form, variable_value: e.target.value })}
                placeholder={selected.example}
              />
              <p className="text-xs text-ink-muted mt-1">기사에 실제로 삽입될 텍스트입니다. 간결하고 자연스럽게 작성하세요.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">구매 수량 (노출 횟수)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={form.purchased_quantity}
                  onChange={(e) => setForm({ ...form, purchased_quantity: parseInt(e.target.value) })}
                  className="flex-1 accent-ink"
                />
                <span className="font-headline text-3xl font-bold w-16 text-right">{form.purchased_quantity}</span>
              </div>
              <div className="flex justify-between text-xs text-ink-muted mt-1">
                <span>1회</span><span>100회</span>
              </div>
            </div>

            <div className="border-t border-ink pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">총 비용</span>
                <span className="font-headline text-2xl font-bold text-green-700">무료</span>
              </div>
              <p className="text-xs text-ink-muted mt-1">현재 스폰서 베타 기간 — 전 슬롯 무료 제공</p>
            </div>

            {error && <p className="text-red-600 font-bold text-sm">{error}</p>}
            {success && <p className="text-green-700 font-bold text-sm">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-ink text-newsprint-50 font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "처리 중..." : `슬롯 ${form.purchased_quantity}개 활성화`}
            </button>
          </form>
        )}

        <button onClick={() => router.push("/sponsor/dashboard")} className="text-sm font-bold hover:underline">
          ← 대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
}
