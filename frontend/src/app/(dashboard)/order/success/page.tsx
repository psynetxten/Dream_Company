"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Confetti from "@/components/Confetti";
import KakaoShareButton from "@/components/KakaoShareButton";

const TIMELINE = [
  { time: "방금", label: "꿈 의뢰 완료!", done: true },
  { time: "내일 오전 8시", label: "첫 번째 꿈신문 발행", done: false },
  { time: "매일 아침", label: "새로운 이야기 연재", done: false },
];

export default function OrderSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-between px-6 py-16">
      {showConfetti && <Confetti />}

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-6">
        {/* 이모지 + 타이틀 */}
        <div className="text-center">
          <div className="text-6xl mb-4">🗞️</div>
          <h1 className="font-headline font-bold text-3xl text-white leading-tight">
            꿈이<br />시작됩니다!
          </h1>
          <p className="text-[#6B6869] text-sm mt-3 leading-relaxed">
            꿈신문사 기자단이 지금<br />당신의 이야기를 준비하고 있어요
          </p>
        </div>

        {/* 타임라인 카드 */}
        <div className="w-full bg-white rounded-2xl p-5">
          <p className="text-xs font-bold text-[#AEAAA5] uppercase tracking-widest mb-4">발행 일정</p>
          <div className="space-y-4">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                {/* 도트 + 연결선 */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    item.done ? "bg-[#1A1A1A]" : "border-2 border-[#E0DFD8]"
                  }`}>
                    {item.done && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px h-6 bg-[#E0DFD8] mt-1" />
                  )}
                </div>
                {/* 텍스트 */}
                <div className="pb-1">
                  <p className={`text-xs font-bold ${item.done ? "text-[#1A1A1A]" : "text-[#AEAAA5]"}`}>
                    {item.time}
                  </p>
                  <p className={`text-sm mt-0.5 ${item.done ? "text-[#1A1A1A] font-medium" : "text-[#6B6869]"}`}>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 공유 유도 */}
        <div className="w-full bg-white/10 rounded-2xl p-4 text-center">
          <p className="text-white text-sm font-medium">
            친구에게 꿈신문사를 알려주세요 🔥
          </p>
          <p className="text-[#6B6869] text-xs mt-1">
            친구도 꿈신문을 시작할 수 있어요
          </p>
          <div className="mt-3">
            <KakaoShareButton
              title="꿈신문사 — 당신의 꿈이 헤드라인이 됩니다"
              description="매일 아침 내 꿈이 신문이 되어 도착해요 📰 꿈신문사에서 당신의 이야기를 시작해보세요"
              linkUrl="/"
              buttonLabel="카카오톡으로 공유하기"
            />
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="w-full max-w-sm pt-4">
        <Link href="/dashboard" className="app-btn-primary bg-white text-[#1A1A1A]">
          대시보드에서 확인하기 →
        </Link>
      </div>
    </div>
  );
}
