"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { templateApi } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  identity: "나",
  career: "커리어",
  achievement: "성취",
  relationship: "관계",
  location: "장소",
  brand: "브랜드",
  custom: "기타",
};

interface Slot {
  slot_key: string;
  slot_label: string;
  slot_hint: string | null;
  slot_category: string;
  is_required: boolean;
  default_value: string | null;
  display_order: number;
}

interface TemplateDetail {
  id: string;
  title: string;
  description: string;
  genre: string;
  duration_days: number;
  price_krw: number;
  future_year: number;
  preview_headline: string | null;
  preview_lead: string | null;
  purchase_count: number;
  slots: Slot[];
}

export default function MarketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [slotValues, setSlotValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await templateApi.getMarket(id as string);
        setTemplate(res.data);
        // 기본값 초기화
        const defaults: Record<string, string> = {};
        res.data.slots.forEach((s: Slot) => {
          if (s.default_value) defaults[s.slot_key] = s.default_value;
        });
        setSlotValues(defaults);
      } catch {
        router.replace("/market");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // 미리보기: 슬롯값이 바뀔 때마다 헤드라인 치환
  useEffect(() => {
    if (!template?.preview_headline) return;
    let txt = template.preview_headline;
    Object.entries(slotValues).forEach(([k, v]) => {
      if (v) txt = txt.replaceAll(`[${k}]`, v);
    });
    setPreview(txt);
  }, [slotValues, template]);

  const handleSubmit = async () => {
    if (!template) return;
    // 필수 슬롯 체크
    const missing = template.slots
      .filter(s => s.is_required && !slotValues[s.slot_key])
      .map(s => s.slot_label);
    if (missing.length > 0) {
      alert(`필수 항목을 입력해주세요: ${missing.join(", ")}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await templateApi.purchase(id as string, slotValues);
      const { order_id, protagonist, newspaper_count } = res.data;
      alert(`🎉 ${protagonist}님의 신문 ${newspaper_count}편이 완성됐습니다!`);
      router.push(`/newspapers/${order_id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "구매에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-serif italic">불러오는 중...</div>;
  if (!template) return null;

  const grouped = template.slots.reduce((acc, s) => {
    const cat = s.slot_category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <div className="min-h-screen bg-newsprint-50">
      <header className="border-b-4 border-double border-ink bg-newsprint-100 px-8 py-5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => router.back()} className="text-sm font-bold hover:underline uppercase tracking-widest">
            ← 마켓으로
          </button>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted font-bold">꿈신문사 마켓</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* 왼쪽: 템플릿 정보 + 미리보기 */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="bg-ink text-newsprint-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest inline-block mb-3">
                {template.genre} · {template.duration_days}일
              </div>
              <h1 className="font-headline text-3xl font-black leading-tight mb-4">{template.title}</h1>

              <div className="border-2 border-ink p-4 bg-newsprint-100 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2">미리보기</p>
                <p className="font-serif italic text-sm leading-relaxed">
                  &ldquo;{preview || template.preview_headline}&rdquo;
                </p>
                {template.preview_lead && (
                  <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                    {template.preview_lead}
                  </p>
                )}
                <p className="text-[9px] text-ink-muted mt-3 uppercase tracking-widest">
                  * 이름 입력 시 실시간 반영
                </p>
              </div>

              <div className="text-center border-2 border-ink p-4">
                <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-1">가격</p>
                <p className="font-headline text-3xl font-black">
                  {template.price_krw === 0 ? "무료" : `₩${template.price_krw.toLocaleString()}`}
                </p>
                <p className="text-xs text-ink-muted mt-1">{template.duration_days}편 완성본 즉시 발행</p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 슬롯 입력 폼 */}
          <div className="lg:col-span-3">
            <h2 className="font-headline text-xl font-bold uppercase tracking-widest border-b-2 border-ink pb-3 mb-6">
              내 정보 입력
            </h2>
            <p className="font-serif text-sm text-ink-muted mb-8">
              아래 빈칸을 채우면, 작가의 원고 속 주인공이 <strong>당신</strong>으로 바뀝니다.
            </p>

            {Object.entries(grouped).map(([category, slots]) => (
              <div key={category} className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted border-b border-ink/30 pb-1 mb-4">
                  {CATEGORY_LABELS[category] || category}
                </p>
                <div className="space-y-4">
                  {slots.sort((a, b) => a.display_order - b.display_order).map(slot => (
                    <div key={slot.slot_key}>
                      <label className="block text-sm font-bold mb-1">
                        {slot.slot_label}
                        {slot.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        value={slotValues[slot.slot_key] || ""}
                        onChange={e => setSlotValues(prev => ({ ...prev, [slot.slot_key]: e.target.value }))}
                        placeholder={slot.slot_hint || `${slot.slot_label}을(를) 입력하세요`}
                        className="w-full border-2 border-ink px-3 py-2 bg-transparent font-serif focus:outline-none focus:bg-newsprint-100 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-ink text-newsprint-50 py-4 font-headline font-bold text-lg uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50 mt-4"
            >
              {submitting ? "신문 제작 중..." : `✦ 내 이름으로 신문 만들기`}
            </button>
            <p className="text-xs text-ink-muted text-center mt-3 font-serif italic">
              구매 즉시 {template.duration_days}편 전체가 생성됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
