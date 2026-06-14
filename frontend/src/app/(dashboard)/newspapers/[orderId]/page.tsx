"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ordersApi, newspapersApi, Newspaper } from "@/lib/api";
import NewspaperLayout from "@/components/newspaper/NewspaperLayout";
import AppBar from "@/components/AppBar";
import KakaoShareButton from "@/components/KakaoShareButton";
import { recordActivity } from "@/hooks/useStreak";

export default function NewspapersPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [newspapers, setNewspapers] = useState<Newspaper[]>([]);
  const [selectedNewspaper, setSelectedNewspaper] = useState<Newspaper | null>(null);
  const [protagonistName, setProtagonistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  // 탭 전환 시 중복 API 호출 방지 캐시 (id → 전체 Newspaper)
  const [newspaperCache, setNewspaperCache] = useState<Map<string, Newspaper>>(new Map());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderRes, newspapersRes] = await Promise.all([
          ordersApi.get(orderId),
          ordersApi.getNewspapers(orderId),
        ]);

        setProtagonistName(orderRes.data.protagonist_name);
        const publishedNewspapers = (newspapersRes.data as Newspaper[]).filter(
          (n) => n.status === "published"
        );
        setNewspapers(publishedNewspapers);

        if (publishedNewspapers.length > 0) {
          const latestRes = await newspapersApi.get(
            publishedNewspapers[publishedNewspapers.length - 1].id
          );
          const latest = latestRes.data;
          // 초기 캐시에 최신 편 저장
          setNewspaperCache(new Map([[latest.id, latest]]));
          setSelectedNewspaper(latest);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    recordActivity(); // 신문 읽기 = 오늘의 활동 기록 → 스트릭 유지
  }, [orderId]);

  const handleSelectNewspaper = async (newspaper: Newspaper) => {
    if (selecting || selectedNewspaper?.id === newspaper.id) return;

    // 캐시 히트: API 호출 없이 즉시 전환
    const cached = newspaperCache.get(newspaper.id);
    if (cached) {
      setSelectedNewspaper(cached);
      return;
    }

    setSelecting(true);
    try {
      const res = await newspapersApi.get(newspaper.id);
      const full = res.data;
      // 캐시에 저장 → 다음 클릭은 즉시
      setNewspaperCache((prev) => new Map(prev).set(full.id, full));
      setSelectedNewspaper(full);
    } catch (error) {
      console.error(error);
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <AppBar
        showBack
        backHref="/"
        title={protagonistName ? `${protagonistName}의 꿈신문` : "꿈신문"}
      />

      <div className="pt-safe-header pb-safe-nav max-w-2xl mx-auto">
        {/* 에피소드 선택 바 */}
        {!loading && newspapers.length > 0 && (
          <div className="px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max">
              {newspapers.map((newspaper) => {
                const isSelected = selectedNewspaper?.id === newspaper.id;
                return (
                  <button
                    key={newspaper.id}
                    onClick={() => handleSelectNewspaper(newspaper)}
                    disabled={selecting}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      isSelected
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white text-[#6B6869] border border-[#E0DFD8] hover:border-[#1A1A1A]"
                    }`}
                  >
                    {newspaper.episode_number}편
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 공유 버튼 */}
        {!loading && selectedNewspaper && (
          <div className="px-4 pt-2 pb-1 flex justify-end">
            <KakaoShareButton
              title={`📰 ${selectedNewspaper.headline}`}
              description={`${protagonistName}의 꿈신문 — 꿈신문사에서 당신의 이야기를 시작해보세요`}
              linkUrl={`/newspapers/${orderId}`}
              buttonLabel="공유하기"
              className="flex items-center gap-1.5 text-xs font-bold text-[#6B6869] bg-white border border-[#E0DFD8] rounded-full px-3 py-1.5 active:bg-[#F2F1EB] transition-colors"
            />
          </div>
        )}

        {/* 신문 본문 영역 */}
        <div className="px-4 pt-2">
          {loading ? (
            <div className="space-y-4 pt-4">
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-32 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
          ) : selectedNewspaper ? (
            <div className={`transition-opacity duration-200 ${selecting ? "opacity-50" : "opacity-100"}`}>
              <NewspaperLayout
                newspaper={selectedNewspaper}
                protagonistName={protagonistName}
              />
            </div>
          ) : (
            /* 빈 상태 */
            <div className="app-card p-10 text-center mt-4">
              <div className="w-16 h-16 rounded-full bg-[#F2F1EB] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="#AEAAA5" strokeWidth="1.8"/>
                  <line x1="7" y1="9" x2="17" y2="9" stroke="#AEAAA5" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="7" y1="13" x2="13" y2="13" stroke="#AEAAA5" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="font-headline font-bold text-[#1A1A1A] text-base mb-2">
                첫 번째 꿈신문을 기다리고 있어요
              </p>
              <p className="text-sm text-[#6B6869]">
                내일 오전 8시에
                {protagonistName && ` ${protagonistName}의`} 꿈신문 첫 편이 발행됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
