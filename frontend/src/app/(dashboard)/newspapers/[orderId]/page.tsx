"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ordersApi, newspapersApi, Newspaper } from "@/lib/api";
import NewspaperLayout from "@/components/newspaper/NewspaperLayout";

export default function NewspapersPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [newspapers, setNewspapers] = useState<Newspaper[]>([]);
  const [selectedNewspaper, setSelectedNewspaper] = useState<Newspaper | null>(null);
  const [protagonistName, setProtagonistName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderRes, newspapersRes] = await Promise.all([
          ordersApi.get(orderId),
          ordersApi.getNewspapers(orderId),
        ]);

        setProtagonistName(orderRes.data.protagonist_name);
        const publishedNewspapers = newspapersRes.data.filter(
          (n: Newspaper) => n.status === "published"
        );
        setNewspapers(publishedNewspapers);

        if (publishedNewspapers.length > 0) {
          // 최신 편 상세 로드
          const latestRes = await newspapersApi.get(
            publishedNewspapers[publishedNewspapers.length - 1].id
          );
          setSelectedNewspaper(latestRes.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId]);

  const handleSelectNewspaper = async (newspaper: Newspaper) => {
    try {
      const res = await newspapersApi.get(newspaper.id);
      setSelectedNewspaper(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-headline text-2xl text-ink-muted">신문 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* 사이드바: 에피소드 목록 */}
        <aside className="w-64 flex-shrink-0">
          <div className="border-2 border-ink bg-newsprint-100 p-4 sticky top-8">
            <h2 className="font-headline font-bold text-lg mb-4 border-b border-ink pb-2">
              발행 목록
            </h2>
            <div className="space-y-2">
              {newspapers.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  아직 발행된 신문이 없습니다.
                  <br />
                  내일 오전 8시에 첫 편이 발행됩니다.
                </p>
              ) : (
                newspapers.map((newspaper) => (
                  <button
                    key={newspaper.id}
                    onClick={() => handleSelectNewspaper(newspaper)}
                    className={`w-full text-left p-2 border transition-colors ${
                      selectedNewspaper?.id === newspaper.id
                        ? "border-ink bg-ink text-newsprint-50"
                        : "border-newsprint-300 hover:bg-newsprint-200"
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {newspaper.episode_number}편
                    </div>
                    <div className="text-xs opacity-70">
                      {newspaper.future_date_label || newspaper.future_date}
                    </div>
                    {newspaper.headline && (
                      <div className="text-xs mt-1 line-clamp-2 opacity-80">
                        {newspaper.headline}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-ink">
              <Link
                href="/dashboard"
                className="text-xs text-ink-muted hover:text-ink transition-colors"
              >
                ← 대시보드로
              </Link>
            </div>
          </div>
        </aside>

        {/* 신문 본문 */}
        <main className="flex-1">
          {selectedNewspaper ? (
            <NewspaperLayout
              newspaper={selectedNewspaper}
              protagonistName={protagonistName}
            />
          ) : (
            <div className="border-2 border-ink bg-newsprint-100 p-12 text-center">
              <div className="font-headline text-2xl font-bold mb-4">
                첫 번째 꿈신문을 기다리고 있습니다
              </div>
              <p className="text-ink-muted">
                내일 오전 8시에 {protagonistName}의 꿈신문 첫 편이 발행됩니다.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
