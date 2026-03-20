"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templateApi } from "@/lib/api";
import Link from "next/link";

const GENRES = [
  { key: "", label: "전체" },
  { key: "career", label: "커리어" },
  { key: "sports", label: "스포츠" },
  { key: "arts", label: "예술" },
  { key: "science", label: "과학" },
  { key: "business", label: "비즈니스" },
  { key: "social", label: "사회" },
];

interface Template {
  id: string;
  title: string;
  description: string;
  genre: string;
  theme: string;
  duration_days: number;
  price_krw: number;
  future_year: number;
  preview_headline: string;
  preview_lead: string;
  purchase_count: number;
  slot_count: number;
}

export default function MarketPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async (genre: string) => {
    setLoading(true);
    try {
      const res = await templateApi.listMarket(genre || undefined);
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(selectedGenre);
  }, [selectedGenre]);

  return (
    <div className="min-h-screen bg-newsprint-50">
      {/* 헤더 */}
      <header className="border-b-4 border-double border-ink bg-newsprint-100 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-ink-muted mb-1">꿈신문사 마켓</p>
              <h1 className="font-headline text-5xl font-black uppercase tracking-widest">THE DREAM MARKET</h1>
              <p className="font-serif italic text-ink-muted mt-2">
                작가가 써둔 시리즈를 구매하면, 당신의 이름으로 개인화됩니다
              </p>
            </div>
            <Link href="/dashboard" className="text-sm border-2 border-ink px-4 py-2 font-bold uppercase tracking-widest hover:bg-ink hover:text-newsprint-50 transition-colors">
              내 신문함 →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* 장르 필터 */}
        <div className="flex gap-2 mb-10 border-b-2 border-ink pb-4 overflow-x-auto">
          {GENRES.map(g => (
            <button
              key={g.key}
              onClick={() => setSelectedGenre(g.key)}
              className={`px-4 py-1.5 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                selectedGenre === g.key
                  ? "bg-ink text-newsprint-50"
                  : "border-2 border-ink hover:bg-newsprint-200"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* 개인화 안내 배너 */}
        <div className="border-2 border-ink bg-newsprint-200 p-4 mb-10 flex items-start gap-4">
          <span className="text-2xl">✦</span>
          <div>
            <p className="font-bold text-sm uppercase tracking-widest mb-1">이렇게 작동합니다</p>
            <p className="font-serif text-sm text-ink-muted">
              시리즈를 선택 → 이름·직업·회사 등 슬롯 입력 → 즉시 내 이름이 들어간 신문 7편 생성.
              작가가 쓴 스토리가 오직 나만을 위한 이야기로 변환됩니다.
            </p>
          </div>
        </div>

        {/* 템플릿 목록 */}
        {loading ? (
          <p className="text-center font-serif italic text-ink-muted py-20">마켓을 불러오는 중...</p>
        ) : templates.length === 0 ? (
          <p className="text-center font-serif italic text-ink-muted py-20 border-2 border-dashed border-ink-muted">
            등록된 시리즈가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => (
              <article key={t.id} className="border-2 border-ink bg-newsprint-50 hover:shadow-lg transition-shadow">
                {/* 장르 배지 */}
                <div className="bg-ink text-newsprint-50 px-4 py-1 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.genre}</span>
                  <span className="text-[10px] font-bold">{t.duration_days}일 시리즈</span>
                </div>

                <div className="p-6">
                  {/* 제목 */}
                  <h2 className="font-headline text-2xl font-bold mb-1 leading-tight">{t.title}</h2>
                  {t.theme && <p className="text-xs text-ink-muted uppercase tracking-widest mb-4">{t.theme}</p>}

                  {/* 미리보기 헤드라인 */}
                  {t.preview_headline && (
                    <div className="border-l-4 border-ink pl-3 mb-4">
                      <p className="font-serif italic text-sm leading-relaxed text-ink-muted">
                        &ldquo;{t.preview_headline}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* 슬롯 개수 */}
                  <div className="flex items-center gap-3 mb-4 text-xs text-ink-muted">
                    <span>✦ 슬롯 {t.slot_count}개 개인화</span>
                    <span>·</span>
                    <span>{t.future_year}년 배경</span>
                    <span>·</span>
                    <span>{t.purchase_count}명 구매</span>
                  </div>

                  {/* 가격 + 구매 버튼 */}
                  <div className="flex justify-between items-center pt-4 border-t border-ink/20">
                    <div>
                      <span className="font-headline text-2xl font-black">
                        {t.price_krw === 0 ? "무료" : `₩${t.price_krw.toLocaleString()}`}
                      </span>
                    </div>
                    <Link
                      href={`/market/${t.id}`}
                      className="bg-ink text-newsprint-50 px-6 py-2 font-bold text-sm uppercase tracking-widest hover:bg-ink/80 transition-colors"
                    >
                      내 이름으로 →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
