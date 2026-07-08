"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ordersApi, getApiBaseUrl } from "@/lib/api";
import AppBar from "@/components/AppBar";

interface Companions {
  count: number;
  aspirations: { line: string; year: number }[];
  new_this_week: number;
}

export default function CompanionsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<string>("");
  const [data, setData] = useState<Companions | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login?next=/companions");
        return;
      }
      setChecking(false);
      // 유저의 가장 최근 의뢰에서 목표 직군을 가져와 개인화
      let r = "";
      try {
        const res = await ordersApi.list();
        const orders = res.data || [];
        r = orders[0]?.target_role || "";
        setRole(r);
      } catch {}
      fetch(`${getApiBaseUrl()}/api/v1/orders/dream-companions?role=${encodeURIComponent(r)}`)
        .then((res) => res.json())
        .then(setData)
        .catch(() => {});
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-dvh bg-[#F4F3EE] flex items-center justify-center">
        <div className="skeleton h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F3EE]">
      <AppBar showBack title="꿈 동료" />
      <div className="pt-safe-header pb-safe-nav px-4 max-w-lg mx-auto">

        {/* 히어로 */}
        <div className="pt-6">
          <p className="text-xs text-[#A89F8C] tracking-[0.18em] font-medium">같은 미래를 향한 사람들</p>
          <h1 className="font-headline text-2xl text-[#1A1A1A] leading-snug mt-2.5">
            {!data || data.count <= 1 ? (
              <>당신은 <span className="font-bold">{role || "이 꿈"}</span>의<br />첫 번째 주인공입니다</>
            ) : (
              <>당신처럼 <span className="font-bold">‘{role}’</span>을<br />꿈꾸는 사람 <span className="font-bold">{data.count.toLocaleString()}명</span></>
            )}
          </h1>
          <p className="text-sm text-[#6B6560] mt-2">당신의 꿈은 혼자가 아닙니다.</p>
        </div>

        {/* 열망 벽 */}
        {data && data.aspirations?.length > 0 && (
          <div className="mt-7">
            <p className="text-[11px] text-[#A89F8C] tracking-[0.14em] mb-3">이들이 향하는 미래</p>
            <div className="app-card divide-y divide-[#EAE7DC]">
              {data.aspirations.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="font-headline font-bold text-sm text-[#8A8272] min-w-[42px]">{a.year}</span>
                  <span className="text-[15px] text-[#1A1A1A] font-headline">{a.line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 모멘텀 */}
        {data && data.new_this_week > 0 && (
          <div className="mt-5 app-card px-4 py-3.5 text-center">
            <p className="text-sm text-[#6B6560]">
              이번 주, <span className="text-[#1A1A1A] font-bold">{data.new_this_week}명</span>이 같은 분야에서 새로 꿈을 시작했어요.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-7 text-center">
          <p className="text-[13px] text-[#A89F8C] leading-relaxed">
            당신의 꿈도 이 벽에 함께 걸립니다.<br />오늘의 신문을 이어서 받아보세요.
          </p>
        </div>
      </div>
    </div>
  );
}
