"use client";

import { useEffect, useState } from "react";
import { sponsorApi, SponsorAnalytics } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "slots" | "matches" | "analytics";

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
          {(["slots", "matches", "analytics"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 font-bold uppercase text-sm tracking-wider border-b-4 -mb-0.5 transition-colors ${
                tab === t ? "border-ink" : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {t === "slots" ? "광고 슬롯" : t === "matches" ? "매칭 리포트" : "분석"}
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
      </div>
    </div>
  );
}
