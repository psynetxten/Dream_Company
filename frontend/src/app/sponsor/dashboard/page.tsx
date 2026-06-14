"use client";

import { useEffect, useState } from "react";
import { sponsorApi, SponsorAnalytics } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "slots" | "matches" | "analytics" | "placement";

export default function SponsorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<SponsorAnalytics | null>(null);
  const [tab, setTab] = useState<Tab>("slots");
  const [loading, setLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, slotsRes, matchesRes, analyticsRes] = await Promise.all([
          sponsorApi.getProfile(),
          sponsorApi.getSlots(),
          sponsorApi.getMatches(),
          sponsorApi.getAnalytics(),
        ]);
        setProfile(profileRes.data);
        setSlots(slotsRes.data);
        setMatches(matchesRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err: any) {
        if (err.response?.status === 404) setNoProfile(true);
        else console.error("Failed to fetch sponsor data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-serif italic">스폰서 센터 접속 중...</div>;
  }

  if (noProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-ink p-8">
        <h1 className="font-headline text-4xl font-bold">스폰서 프로필이 없습니다</h1>
        <p className="text-ink-muted italic">먼저 기업 스폰서로 등록해 주세요.</p>
        <Link href="/sponsor/register"
          className="px-8 py-4 bg-ink text-newsprint-50 font-bold uppercase tracking-widest hover:opacity-90">
          스폰서 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-newsprint-50 text-ink p-8">
      {/* 헤더 */}
      <header className="max-w-6xl mx-auto border-b-4 border-ink pb-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline text-5xl font-bold uppercase tracking-tighter">Sponsor Center</h1>
            <p className="text-sm text-ink-muted mt-2 italic">기업 파트너 전용 관리 시스템</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold font-headline">{profile?.company_name}</div>
            <div className="text-xs uppercase tracking-widest text-ink-muted">{profile?.industry}</div>
            <div className="flex gap-2 mt-2 justify-end">
              <Link href="/sponsor/register"
                className="text-xs border border-ink px-2 py-1 font-bold hover:bg-newsprint-200">
                프로필 수정
              </Link>
              <Link href="/sponsor/slots"
                className="text-xs bg-ink text-newsprint-50 px-2 py-1 font-bold hover:opacity-90">
                + 슬롯 구매
              </Link>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}
                className="text-xs border border-ink px-2 py-1 font-bold hover:bg-ink hover:text-newsprint-50 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 분석 요약 카드 */}
      {analytics && (
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "보유 슬롯", value: analytics.total_slots },
            { label: "활성 슬롯", value: analytics.active_slots },
            { label: "총 노출 횟수", value: analytics.total_exposures },
            { label: "게재된 신문", value: analytics.newspapers_featured },
          ].map(({ label, value }) => (
            <div key={label} className="border-2 border-ink p-4 bg-newsprint-100 text-center">
              <div className="font-headline text-3xl font-bold">{value}</div>
              <div className="text-xs uppercase tracking-widest text-ink-muted mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 탭 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex border-b-2 border-ink mb-8">
          {(["slots", "matches", "analytics", "placement"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 font-bold uppercase text-sm tracking-wider border-b-4 -mb-0.5 transition-colors ${
                tab === t ? "border-ink" : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {t === "slots" ? "광고 슬롯" : t === "matches" ? "매칭 리포트" : t === "analytics" ? "분석" : "지면 안내"}
            </button>
          ))}
        </div>

        {/* 슬롯 탭 */}
        {tab === "slots" && (
          <div className="space-y-4">
            {slots.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-ink/30 text-center italic text-ink-muted">
                <p className="mb-4">구매한 슬롯이 없습니다.</p>
                <Link href="/sponsor/slots"
                  className="px-6 py-2 bg-ink text-newsprint-50 font-bold uppercase text-sm hover:opacity-90">
                  첫 슬롯 구매하기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="border-2 border-ink p-4 bg-newsprint-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase p-1 bg-ink text-newsprint-50">{slot.slot_type}</span>
                      <span className={`text-xs font-bold px-2 py-1 ${slot.remaining_quantity > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {slot.remaining_quantity} / {slot.purchased_quantity} 남음
                      </span>
                    </div>
                    <div className="text-sm font-bold mb-1 italic">"{slot.variable_value}"</div>
                    <div className="text-[10px] text-ink-muted uppercase">
                      {slot.is_auto_matched ? "자동 매칭 활성화" : "대기 중"}
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed border-ink/30 p-4 flex items-center justify-center">
                  <Link href="/sponsor/slots" className="font-bold text-sm hover:underline">+ 새 슬롯 추가</Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 매칭 리포트 탭 */}
        {tab === "matches" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.length === 0 ? (
              <div className="col-span-2 p-12 border-2 border-dashed border-ink/30 text-center italic text-ink-muted">
                아직 매칭된 신문이 없습니다. 슬롯이 활성화되면 자동으로 매칭됩니다.
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="border-2 border-ink p-6 bg-newsprint-100 flex flex-col hover:shadow-lg transition-shadow">
                  <div className="text-[10px] font-bold text-ink-muted uppercase mb-2">
                    Issue #{match.episode_number} · {match.future_date}
                  </div>
                  <h3 className="font-headline text-lg font-bold mb-3 line-clamp-2">{match.headline}</h3>
                  <div className="mt-auto pt-4 border-t border-ink/10 flex justify-between items-center">
                    <span className="text-[10px] font-bold bg-green-100 px-2 py-1 text-green-800">매칭됨</span>
                    <Link href={`/newspapers/${match.id}`} className="text-xs font-bold hover:underline">상세보기 →</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 분석 탭 */}
        {tab === "analytics" && analytics && (
          <div className="space-y-8">
            <div className="border-2 border-ink p-6 bg-newsprint-100">
              <h3 className="font-headline text-xl font-bold mb-4">노출 현황</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span>슬롯 사용률</span>
                    <span>{analytics.total_exposures + analytics.remaining_impressions > 0
                      ? Math.round((analytics.total_exposures / (analytics.total_exposures + analytics.remaining_impressions)) * 100)
                      : 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-newsprint-200 border border-ink/20">
                    <div
                      className="h-full bg-ink transition-all"
                      style={{
                        width: `${analytics.total_exposures + analytics.remaining_impressions > 0
                          ? Math.round((analytics.total_exposures / (analytics.total_exposures + analytics.remaining_impressions)) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center pt-2">
                  <div>
                    <div className="font-headline text-2xl font-bold">{analytics.total_exposures}</div>
                    <div className="text-xs text-ink-muted uppercase">총 노출</div>
                  </div>
                  <div>
                    <div className="font-headline text-2xl font-bold">{analytics.newspapers_featured}</div>
                    <div className="text-xs text-ink-muted uppercase">게재 신문</div>
                  </div>
                  <div>
                    <div className="font-headline text-2xl font-bold">{analytics.remaining_impressions}</div>
                    <div className="text-xs text-ink-muted uppercase">남은 노출</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-ink p-6 bg-newsprint-100">
              <h3 className="font-headline text-xl font-bold mb-2">타겟팅 설정</h3>
              <div className="space-y-3">
                {profile?.target_roles?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase text-ink-muted mb-1">타겟 직업군</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.target_roles.map((r: string) => (
                        <span key={r} className="text-xs bg-ink text-newsprint-50 px-2 py-1 font-bold">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {profile?.target_keywords?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase text-ink-muted mb-1">키워드</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.target_keywords.map((k: string) => (
                        <span key={k} className="text-xs border border-ink px-2 py-1">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/sponsor/register"
                className="inline-block mt-4 text-xs font-bold hover:underline">
                타겟팅 수정 →
              </Link>
            </div>
          </div>
        )}
        {/* 지면 안내 탭 */}
        {tab === "placement" && (
          <div className="space-y-10">
            {/* 설명 */}
            <div className="border-l-4 border-ink pl-6">
              <h3 className="font-headline text-2xl font-bold mb-2">스폰서 지면은 어디에 노출되나요?</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                꿈신문사 광고는 배너가 아닙니다. 독자의 꿈 이야기 안에 <strong>귀사 브랜드가 자연스럽게 등장</strong>합니다.
                매일 아침 발행되는 신문 1편에 두 곳의 지면이 할당됩니다.
              </p>
            </div>

            {/* 신문 레이아웃 미리보기 */}
            <div className="border-2 border-ink bg-newsprint-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3 text-center">
                신문 1편 레이아웃 (실제 지면 구조)
              </div>

              {/* 마스트헤드 */}
              <div className="border-b-4 border-double border-ink pb-2 mb-3 text-center">
                <div className="font-headline text-2xl font-black tracking-tighter">꿈신문사</div>
                <div className="text-[9px] text-ink-muted tracking-widest">DREAM NEWSPAPER — 당신의 꿈이 이루어진 날</div>
              </div>

              {/* 헤드라인 */}
              <div className="border-b border-ink pb-2 mb-3">
                <div className="font-headline text-base font-bold leading-tight text-ink">
                  이준호, 2030년 AI 스타트업 CTO로 선정 — "팀이 전부다"
                </div>
                <div className="text-[10px] text-ink-muted mt-1 italic">
                  실리콘밸리 출신 50인 선정, 역대 최연소 기록 경신
                </div>
              </div>

              {/* 본문 + 사이드바 */}
              <div className="grid grid-cols-3 gap-3">

                {/* 본문 (2/3) — 네이티브 노출 영역 */}
                <div className="col-span-2 relative">
                  <div className="text-[11px] leading-relaxed text-ink space-y-2">
                    <p>
                      이준호 CTO는 지난 3년간 <span className="bg-yellow-200 font-bold px-0.5 rounded">{profile?.company_name || "드림테크"}</span>와의 협업을 통해
                      AI 기반 채용 시스템을 구축했다. 그는 "좋은 팀이 좋은 제품을 만든다"며
                      인재 확보에 남다른 철학을 드러냈다.
                    </p>
                    <p className="text-ink-muted">
                      올해 초 시리즈 B 투자를 유치한 이 CTO는 다음 목표로 글로벌
                      시장 진출을 선언했다. 현재 팀원 120명을 이끌며...
                    </p>
                  </div>

                  {/* 라벨 A */}
                  <div className="absolute -left-2 top-0 flex items-start gap-1">
                    <div className="bg-yellow-400 text-[9px] font-black px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                      ① 본문 네이티브
                    </div>
                  </div>
                </div>

                {/* 사이드바 (1/3) — 광고 박스 영역 */}
                <div className="col-span-1 relative">
                  <div className="border-4 border-double border-ink p-2 bg-newsprint-50 relative">
                    <div className="absolute -top-[8px] left-1/2 -translate-x-1/2 bg-newsprint-50 px-1">
                      <span className="text-[7px] font-bold uppercase tracking-widest text-ink-muted">광고</span>
                    </div>
                    <div className="text-center">
                      <div className="font-headline text-sm font-black uppercase tracking-tight">
                        {profile?.company_name || "드림테크"}
                      </div>
                      <div className="text-[7px] text-ink-muted mt-0.5">{profile?.industry || "IT/AI"}</div>
                      <div className="border-t border-b border-ink/30 py-1.5 my-1.5">
                        <p className="font-serif text-[9px] italic leading-relaxed">
                          "AI로 세상을 다시 정의합니다"
                        </p>
                      </div>
                      <div className="border border-ink px-2 py-0.5 text-[8px] font-bold uppercase inline-block">
                        인재 모집
                      </div>
                    </div>
                  </div>

                  {/* 라벨 B */}
                  <div className="absolute -right-2 top-0">
                    <div className="bg-orange-400 text-[9px] font-black px-1.5 py-0.5 rounded-sm whitespace-nowrap text-white">
                      ② 사이드바 광고
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 두 지면 상세 설명 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-ink p-6 bg-newsprint-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-yellow-400 text-[10px] font-black px-2 py-1 rounded">① 본문 네이티브</span>
                </div>
                <h4 className="font-headline text-lg font-bold mb-2">기사 본문 자연 삽입</h4>
                <p className="text-sm text-ink-muted leading-relaxed mb-4">
                  독자의 꿈 스토리 안에 귀사 이름이 협업사·재직 회사·파트너로 자연스럽게 등장합니다.
                  광고임을 인식하지 못한 채 읽히는 네이티브 포맷입니다.
                </p>
                <ul className="text-xs space-y-1 text-ink-muted">
                  <li>· 기사 본문 1~3회 노출</li>
                  <li>· AI가 문맥에 맞게 자동 삽입</li>
                  <li>· 독자 직군 타겟팅 자동 매칭</li>
                </ul>
              </div>

              <div className="border-2 border-ink p-6 bg-newsprint-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-orange-400 text-[10px] font-black px-2 py-1 rounded text-white">② 사이드바 광고</span>
                </div>
                <h4 className="font-headline text-lg font-bold mb-2">우측 사이드바 광고 박스</h4>
                <p className="text-sm text-ink-muted leading-relaxed mb-4">
                  신문 우측 사이드바에 기업명·카피·CTA가 포함된 클래식 신문 광고 형식으로 노출됩니다.
                  "광고" 라벨이 표시되어 투명성을 유지합니다.
                </p>
                <ul className="text-xs space-y-1 text-ink-muted">
                  <li>· 신문 1편당 1개 광고 박스</li>
                  <li>· 슬롯 구매 시 카피 직접 설정 가능</li>
                  <li>· 업종별 자동 카피 생성 지원</li>
                </ul>
              </div>
            </div>

            {/* 매칭 기준 */}
            <div className="border-2 border-ink p-6 bg-newsprint-100">
              <h4 className="font-headline text-lg font-bold mb-4">어떤 독자에게 노출되나요?</h4>
              <p className="text-sm text-ink-muted mb-4">
                ChromaDB 벡터 검색으로 귀사의 <strong>타겟 직군·키워드</strong>와 독자의 꿈 프로필을 매칭합니다.
                관련성 점수가 임계값 이상인 신문에만 자동 배정됩니다.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                {[
                  { step: "1", label: "타겟 설정", desc: "직군·키워드 등록" },
                  { step: "2", label: "자동 매칭", desc: "벡터 유사도 계산" },
                  { step: "3", label: "지면 삽입", desc: "신문 발행 시 노출" },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="border border-ink/30 p-3">
                    <div className="font-headline text-2xl font-bold text-ink-muted mb-1">{step}</div>
                    <div className="font-bold text-xs uppercase tracking-wide">{label}</div>
                    <div className="text-[10px] text-ink-muted mt-1">{desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/sponsor/register" className="text-xs font-bold hover:underline">
                  타겟 직군·키워드 설정하기 →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
