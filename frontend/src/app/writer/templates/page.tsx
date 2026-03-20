"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templateApi } from "@/lib/api";
import Link from "next/link";

interface MyTemplate {
  id: string;
  title: string;
  genre: string;
  duration_days: number;
  price_krw: number;
  status: string;
  purchase_count: number;
  total_revenue_krw: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-gray-200 text-gray-700" },
  listed: { label: "마켓 등록", color: "bg-green-100 text-green-800" },
  unlisted: { label: "비공개", color: "bg-yellow-100 text-yellow-800" },
};

export default function WriterTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<MyTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    templateApi.myTemplates()
      .then(res => setTemplates(res.data))
      .catch(err => {
        if (err?.response?.status === 401) router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await templateApi.publish(id);
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: "listed" } : t));
      alert("마켓에 등록됐습니다!");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "등록에 실패했습니다.");
    }
  };

  if (loading) return <div className="p-8 text-center font-serif italic">불러오는 중...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="border-b-4 border-ink pb-4 mb-10 flex justify-between items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold uppercase tracking-widest">내 템플릿</h1>
          <p className="text-sm text-ink-muted mt-1 italic">작가가 써둔 시리즈 — 독자가 구매하면 개인화됩니다</p>
        </div>
        <div className="flex gap-3">
          <Link href="/writer/dashboard" className="text-sm border-2 border-ink px-4 py-2 font-bold uppercase tracking-widest hover:bg-newsprint-200 transition-colors">
            ← 집무실
          </Link>
          <Link href="/writer/templates/new" className="text-sm bg-ink text-newsprint-50 px-4 py-2 font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors">
            + 새 템플릿
          </Link>
        </div>
      </header>

      {templates.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-ink-muted">
          <p className="font-serif italic text-ink-muted mb-4">아직 작성한 템플릿이 없습니다.</p>
          <Link href="/writer/templates/new" className="bg-ink text-newsprint-50 px-6 py-3 font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors">
            첫 템플릿 쓰기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map(t => (
            <div key={t.id} className="border-2 border-ink p-6 flex justify-between items-start gap-4 hover:bg-newsprint-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-headline text-xl font-bold">{t.title}</h2>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${STATUS_LABEL[t.status]?.color}`}>
                    {STATUS_LABEL[t.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-ink-muted uppercase tracking-widest">
                  {t.genre} · {t.duration_days}일 · ₩{t.price_krw.toLocaleString()}
                </p>
                {t.purchase_count > 0 && (
                  <p className="text-xs text-green-700 font-bold mt-1">
                    {t.purchase_count}명 구매 · 총 ₩{t.total_revenue_krw.toLocaleString()} 수익
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/writer/templates/${t.id}`}
                  className="text-sm border-2 border-ink px-4 py-2 font-bold uppercase hover:bg-newsprint-200 transition-colors"
                >
                  편집
                </Link>
                {t.status === "draft" && (
                  <button
                    onClick={() => handlePublish(t.id)}
                    className="text-sm bg-ink text-newsprint-50 px-4 py-2 font-bold uppercase hover:bg-ink/80 transition-colors"
                  >
                    마켓 등록
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
