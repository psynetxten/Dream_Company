"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePortal } from "@/components/PortalProvider";
import { newspapersApi, writerApi, sponsorApi, templateApi, Newspaper, Order } from "@/lib/api";

/* ─────────────────────────────────────────
   공용 유틸
───────────────────────────────────────── */
function Divider() {
  return <hr className="border-t-2 border-ink my-2" />;
}

/* ─────────────────────────────────────────
   유저: 신문 카드
───────────────────────────────────────── */
function NewspaperCard({ paper, featured = false }: { paper: Newspaper; featured?: boolean }) {
  return (
    <article className={`border-2 border-ink bg-newsprint-50 flex flex-col overflow-hidden transition-shadow hover:shadow-lg ${featured ? "row-span-2" : ""}`}>
      <div className="bg-ink text-newsprint-50 px-4 py-1.5 flex justify-between text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
        <span>꿈신문사</span>
        <span>{paper.future_date_label || paper.future_date}</span>
        <span>제{paper.episode_number}호</span>
      </div>
      <div className="p-5 flex-1">
        <h3 className={`font-headline font-bold leading-tight mb-2 ${featured ? "text-2xl" : "text-base"}`}>
          {paper.headline || "제목 없음"}
        </h3>
        {paper.subhead && (
          <p className="text-xs italic text-ink-muted mb-3 border-l-2 border-ink pl-2 leading-snug">
            {paper.subhead}
          </p>
        )}
        {paper.lead_paragraph && (
          <p className={`text-sm leading-relaxed text-ink-muted ${featured ? "line-clamp-6" : "line-clamp-3"}`}>
            {paper.lead_paragraph}
          </p>
        )}
      </div>
      <div className="border-t border-newsprint-300 px-4 py-2 flex justify-between text-[10px] text-ink-muted flex-shrink-0">
        <span>꿈신문사 기자단</span>
        <span className="italic">조회 {paper.view_count}</span>
      </div>
    </article>
  );
}

function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`border-2 border-newsprint-300 bg-newsprint-100 flex flex-col animate-pulse ${featured ? "row-span-2" : ""}`}>
      <div className="bg-newsprint-300 h-7 flex-shrink-0" />
      <div className="p-5 flex-1 space-y-2">
        <div className={`bg-newsprint-300 rounded ${featured ? "h-6 w-3/4" : "h-4 w-4/5"}`} />
        <div className="h-3 bg-newsprint-200 rounded w-1/2" />
        <div className="h-3 bg-newsprint-200 rounded w-full" />
      </div>
      <div className="border-t border-newsprint-300 h-10 flex-shrink-0" />
    </div>
  );
}

const SAMPLE_PAPERS: Newspaper[] = [
  { id: "s1", order_id: "", episode_number: 1, future_date: "2031-03-15", future_date_label: "2031년 3월 15일", headline: "김민준, 구글 DeepMind 수석 연구원으로 공식 합류", subhead: "\"10년의 준비가 오늘 결실을 맺었다\" — 전 세계 AI 커뮤니티 주목", lead_paragraph: "김민준 박사가 구글 DeepMind 수석 연구원으로 공식 합류했다. 런던 본사에서 열린 환영 세레모니에서 팀원들의 열렬한 박수를 받으며 입장한 그는 \"솔직히 오늘 아침까지도 꿈인 줄 알았다\"고 말했다.", sidebar_content: {}, variables_used: {}, status: "published", view_count: 241 },
  { id: "s2", order_id: "", episode_number: 7, future_date: "2030-06-22", future_date_label: "2030년 6월 22일", headline: "이서연, 카네기홀 데뷔 무대서 기립박수 10분", subhead: "피아니스트로서의 꿈, 마침내 세계 무대에서 현실이 되다", lead_paragraph: "피아니스트 이서연이 뉴욕 카네기홀 데뷔 무대에서 청중의 기립박수를 10분 넘게 받았다. 공연 직후 \"무대에 서는 순간 이게 꿈인지 현실인지 구분이 안 됐다\"고 떨리는 목소리로 소감을 전했다.", sidebar_content: {}, variables_used: {}, status: "published", view_count: 89 },
  { id: "s3", order_id: "", episode_number: 14, future_date: "2032-11-03", future_date_label: "2032년 11월 3일", headline: "박지호 대표, 창업 3년 만에 유니콘 달성", subhead: "헬스케어 AI 스타트업 기업가치 1조 돌파", lead_paragraph: "박지호 대표가 이끄는 헬스케어 AI 스타트업이 시리즈 C 투자 유치에 성공하며 기업가치 1조 원을 돌파했다. 기자회견장에서 그는 말을 잇지 못하고 한참을 고개를 숙였다.", sidebar_content: {}, variables_used: {}, status: "published", view_count: 178 },
];

/* ═══════════════════════════════════════════
   작가 포털 홈
═══════════════════════════════════════════ */
function WriterHome() {
  const [assigned, setAssigned] = useState<Order[]>([]);
  const [available, setAvailable] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([writerApi.getAssignedOrders(), writerApi.getAvailableOrders()])
      .then(([a, b]) => { setAssigned(a.data || []); setAvailable(b.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "진행 중인 의뢰", value: loading ? "…" : String(assigned.length), href: "/writer/dashboard", cta: "집필 열기", highlight: assigned.length > 0 },
    { label: "새 의뢰 대기", value: loading ? "…" : String(available.length), href: "/writer/dashboard", cta: "수락하기", highlight: available.length > 0 },
    { label: "내 발행 작품", value: "보기", href: "/writer/dashboard", cta: "전체 보기", highlight: false },
    { label: "스폰서 요청", value: "확인", href: "/writer/dashboard", cta: "확인하기", highlight: false },
  ];

  return (
    <div className="min-h-screen bg-newsprint-50 font-serif">
      {/* 마스트헤드 */}
      <header className="bg-ink text-newsprint-50 px-8 py-10 border-b-4 border-newsprint-300">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.4em] text-newsprint-400 mb-2">꿈신문사 · 작가 전용</p>
          <h1 className="font-headline text-5xl font-black tracking-tight mb-2">작가 집무실</h1>
          <p className="text-newsprint-300 text-sm italic">당신의 펜으로 누군가의 꿈이 현실이 됩니다</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── 4칸 액션 허브 ── */}
        <section>
          <h2 className="font-headline text-lg font-bold uppercase tracking-widest border-b-2 border-ink pb-2 mb-6">지금 할 수 있는 것</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Link key={s.label} href={s.href}
                className={`border-2 p-5 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-lg hover:-translate-y-0.5 ${s.highlight ? "border-ink bg-ink text-newsprint-50" : "border-ink bg-newsprint-100 text-ink"}`}>
                <div>
                  <div className={`text-3xl font-headline font-black mb-1 ${s.highlight ? "text-newsprint-50" : "text-ink"}`}>{s.value}</div>
                  <div className={`text-[11px] uppercase tracking-widest ${s.highlight ? "text-newsprint-300" : "text-ink-muted"}`}>{s.label}</div>
                </div>
                <div className={`text-[10px] font-bold uppercase mt-4 ${s.highlight ? "text-newsprint-300" : "text-ink-muted"}`}>{s.cta} →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 진행 중 의뢰 (즉시 집필) ── */}
        <section>
          <h2 className="font-headline text-lg font-bold uppercase tracking-widest border-b-2 border-ink pb-2 mb-6">
            바로 집필하기
            {assigned.length > 0 && <span className="ml-2 text-sm text-ink-muted normal-case font-normal italic">— {assigned.length}건 진행 중</span>}
          </h2>
          {loading ? (
            <div className="text-ink-muted italic text-sm">불러오는 중...</div>
          ) : assigned.length === 0 ? (
            <div className="border-2 border-dashed border-newsprint-300 p-10 text-center text-ink-muted italic">
              <p className="mb-4">배정된 의뢰가 없습니다.</p>
              <Link href="/writer/dashboard" className="text-sm font-bold text-ink hover:underline">새 의뢰 둘러보기 →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assigned.map((order) => (
                <div key={order.id} className="border-2 border-ink bg-newsprint-50 p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-headline font-bold text-lg truncate">{order.protagonist_name}의 꿈</div>
                    <div className="text-xs text-ink-muted mt-0.5 italic truncate">{order.target_role}{order.target_company ? ` · ${order.target_company}` : ""}</div>
                    <p className="text-sm text-ink-muted mt-2 line-clamp-1 font-serif">"{order.dream_description}"</p>
                  </div>
                  <Link href={`/writer/editor/${order.id}`}
                    className="flex-shrink-0 bg-ink text-newsprint-50 px-6 py-3 font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity whitespace-nowrap">
                    집필 시작 →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 새 의뢰 수락 ── */}
        {available.length > 0 && (
          <section>
            <h2 className="font-headline text-lg font-bold uppercase tracking-widest border-b-2 border-ink pb-2 mb-6">
              작가를 기다리는 꿈 <span className="ml-2 text-pro-accent">{available.length}건</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {available.slice(0, 4).map((order) => (
                <div key={order.id} className="border-2 border-dashed border-ink p-5 bg-newsprint-100">
                  <div className="font-bold text-base mb-1">{order.protagonist_name}님</div>
                  <div className="text-xs text-ink-muted mb-2 italic">{order.target_role}</div>
                  <p className="text-sm text-ink-muted line-clamp-2 font-serif mb-4">"{order.dream_description}"</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">예상 수익 KRW 40,000</span>
                    <Link href="/writer/dashboard" className="text-xs font-bold border-2 border-ink px-3 py-1.5 hover:bg-newsprint-200 transition-colors uppercase">
                      수락하기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {available.length > 4 && (
              <div className="text-center mt-4">
                <Link href="/writer/dashboard" className="text-sm font-bold hover:underline">+{available.length - 4}건 더 보기</Link>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   스폰서 포털 홈
═══════════════════════════════════════════ */
function SponsorHome() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    sponsorApi.getAnalytics()
      .then((r) => { setAnalytics(r.data); setHasProfile(true); })
      .catch((e) => { setHasProfile(e?.response?.status === 404 ? false : null); });
  }, []);

  const steps = [
    { n: "01", title: "기업 등록", desc: "회사명, 산업군, 타겟 직업군을 입력합니다. 3분이면 충분합니다.", href: "/sponsor/register", cta: hasProfile ? "수정하기" : "지금 등록", done: hasProfile === true },
    { n: "02", title: "광고 슬롯 구매", desc: "기사에 브랜드를 자연스럽게 삽입할 슬롯을 선택합니다. 현재 무료 베타.", href: "/sponsor/slots", cta: "슬롯 선택", done: analytics?.total_slots > 0 },
    { n: "03", title: "매칭 결과 확인", desc: "AI가 꿈이 맞는 독자를 자동 선별해 브랜드를 노출합니다.", href: "/sponsor/dashboard", cta: "대시보드 보기", done: analytics?.total_exposures > 0 },
  ];

  return (
    <div className="min-h-screen bg-newsprint-50 font-serif">
      {/* 마스트헤드 */}
      <header className="bg-newsprint-900 text-newsprint-50 px-8 py-10 border-b-4 border-newsprint-700">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.4em] text-newsprint-500 mb-2">꿈신문사 · 스폰서 전용</p>
          <h1 className="font-headline text-5xl font-black tracking-tight mb-2">Sponsor Center</h1>
          <p className="text-newsprint-400 text-sm italic">꿈을 가진 독자에게, 자연스럽게</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* ── 현황 요약 (프로필 있을 때) ── */}
        {hasProfile && analytics && (
          <section>
            <h2 className="font-headline text-lg font-bold uppercase tracking-widest border-b-2 border-ink pb-2 mb-6">내 광고 현황</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "보유 슬롯", value: analytics.total_slots },
                { label: "활성 슬롯", value: analytics.active_slots },
                { label: "총 노출", value: analytics.total_exposures },
                { label: "게재 신문", value: analytics.newspapers_featured },
              ].map(({ label, value }) => (
                <div key={label} className="border-2 border-ink bg-ink text-newsprint-50 p-5 text-center">
                  <div className="font-headline text-3xl font-black">{value}</div>
                  <div className="text-[11px] uppercase tracking-widest text-newsprint-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/sponsor/dashboard" className="border-2 border-ink px-6 py-2.5 font-bold text-sm uppercase tracking-widest hover:bg-newsprint-200 transition-colors">
                전체 대시보드 →
              </Link>
              <Link href="/sponsor/slots" className="bg-ink text-newsprint-50 px-6 py-2.5 font-bold text-sm uppercase tracking-widest hover:opacity-80 transition-opacity">
                슬롯 추가 구매
              </Link>
            </div>
          </section>
        )}

        {/* ── 3단계 온보딩 ── */}
        <section>
          <h2 className="font-headline text-lg font-bold uppercase tracking-widest border-b-2 border-ink pb-2 mb-6">
            {hasProfile ? "진행 단계" : "이렇게 시작하세요"}
          </h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.n} className={`border-2 p-6 flex items-center gap-6 transition-all ${s.done ? "border-ink bg-newsprint-100 opacity-60" : "border-ink bg-newsprint-50 hover:shadow-lg"}`}>
                <div className={`font-headline text-4xl font-black flex-shrink-0 ${s.done ? "text-newsprint-400 line-through" : "text-ink"}`}>{s.n}</div>
                <div className="flex-1">
                  <div className="font-bold text-base mb-1 flex items-center gap-2">
                    {s.title}
                    {s.done && <span className="text-[10px] bg-ink text-newsprint-50 px-2 py-0.5 font-bold uppercase">완료</span>}
                  </div>
                  <p className="text-sm text-ink-muted">{s.desc}</p>
                </div>
                <Link href={s.href}
                  className={`flex-shrink-0 px-6 py-3 font-bold uppercase tracking-widest text-sm whitespace-nowrap transition-colors ${s.done ? "border border-newsprint-300 text-ink-muted" : "bg-ink text-newsprint-50 hover:opacity-80"}`}>
                  {s.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── 왜 꿈신문사인가 ── */}
        {!hasProfile && (
          <section className="border-4 border-ink bg-ink text-newsprint-50 p-8">
            <h2 className="font-headline text-2xl font-bold mb-6">꿈신문사 광고가 다른 이유</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "광고처럼 보이지 않습니다", desc: "브랜드가 독자의 꿈 기사 안에 자연스럽게 녹아듭니다. 독자는 스토리를 읽고, 브랜드는 기억됩니다." },
                { title: "정확한 타겟에게 도달합니다", desc: "AI가 꿈의 내용을 분석해 브랜드와 맞는 독자에게만 노출합니다. 의료 브랜드는 의사 꿈을 가진 독자에게." },
                { title: "잠재 지원자 풀이 됩니다", desc: "독자의 꿈 = 그 기업의 미래 지원자. 채용 브랜딩과 광고를 동시에 해결합니다." },
              ].map((item) => (
                <div key={item.title}>
                  <div className="font-bold text-sm mb-2 text-newsprint-50">{item.title}</div>
                  <p className="text-xs text-newsprint-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   유저 랜딩 (메인)
═══════════════════════════════════════════ */
interface TopTemplate {
  id: string;
  title: string;
  genre: string;
  duration_days: number;
  price_krw: number;
  preview_headline: string;
  slot_count: number;
  purchase_count: number;
}

export default function LandingPage() {
  const { portalType } = usePortal();
  const [papers, setPapers] = useState<Newspaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [topTemplates, setTopTemplates] = useState<TopTemplate[]>([]);

  useEffect(() => {
    newspapersApi.publicFeed(6)
      .then((res) => setPapers(res.data?.length ? res.data : SAMPLE_PAPERS))
      .catch(() => setPapers(SAMPLE_PAPERS))
      .finally(() => setLoading(false));
    templateApi.listMarket()
      .then((res) => setTopTemplates((res.data || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  if (portalType === "writer")  return <WriterHome />;
  if (portalType === "sponsor") return <SponsorHome />;

  const displayPapers = papers.length > 0 ? papers : SAMPLE_PAPERS;
  const isSample = papers.length === 0 && !loading;

  return (
    <div className="min-h-screen bg-newsprint-50 font-serif">

      {/* 속보 띠 */}
      <div className="bg-ink text-newsprint-50 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest">
        매일 오전 8시 발행 &nbsp;·&nbsp; 꿈신문사 기자단 &nbsp;·&nbsp; 당신의 꿈이 헤드라인이 됩니다
      </div>

      {/* 히어로 */}
      <header className="border-b-4 border-ink text-center px-6 pt-10 pb-8">
        <p className="text-[11px] tracking-[0.4em] uppercase text-ink-muted mb-3">Dream Newspaper &nbsp;·&nbsp; Est. 2026</p>
        <h1 className="font-headline text-[88px] leading-none font-black tracking-[0.08em] mb-4">꿈신문사</h1>
        <p className="text-lg text-ink-muted italic max-w-lg mx-auto mb-2">당신의 이름이 헤드라인을 장식하는 날</p>
        <p className="text-sm text-ink-muted max-w-md mx-auto mb-8">
          꿈이 이루어진 날, 어떤 기사가 나올까요.<br />
          꿈신문사 기자단이 그 날을 오늘의 언어로 씁니다.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register" className="bg-ink text-newsprint-50 px-10 py-3 font-bold text-sm uppercase tracking-widest hover:opacity-80 transition-opacity">
            내 신문 만들기
          </Link>
          <Link href="/preview" className="border-2 border-ink text-ink px-10 py-3 font-bold text-sm uppercase tracking-widest hover:bg-newsprint-200 transition-colors">
            신문 구경하기
          </Link>
        </div>

        {/* 작가 / 스폰서 진입점 */}
        <div className="flex gap-5 justify-center mt-5 text-xs text-ink-muted">
          <Link href="/register/writer" className="hover:text-ink transition-colors flex items-center gap-1">
            <span className="font-bold">✒ 작가로 지원하기</span>
          </Link>
          <span className="text-newsprint-300">·</span>
          <Link href="/register/sponsor" className="hover:text-ink transition-colors flex items-center gap-1">
            <span className="font-bold">◆ 스폰서 등록하기</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">

        {/* ── 꿈 백화점: 발행 중인 신문 ── */}
        <section className="py-12">
          <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-6">
            <h2 className="font-headline text-xl font-bold uppercase tracking-wide">
              {isSample ? "이런 신문이 매일 발행됩니다" : "지금 발행 중인 꿈신문"}
            </h2>
            <Link href="/preview" className="text-[11px] font-bold hover:underline tracking-widest uppercase">
              샘플 전체 보기 →
            </Link>
          </div>

          {/* 3열 그리드 */}
          <div className="grid grid-cols-3 grid-rows-2 gap-4" style={{ minHeight: 420 }}>
            {loading ? (
              <><SkeletonCard featured /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <NewspaperCard paper={displayPapers[0]} featured />
                {displayPapers.slice(1, 3).map((p) => <NewspaperCard key={p.id} paper={p} />)}
              </>
            )}
          </div>
          {!loading && displayPapers.length > 3 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {displayPapers.slice(3, 6).map((p) => <NewspaperCard key={p.id} paper={p} />)}
            </div>
          )}

          {/* 편집국 노트 */}
          <div className="mt-8 border-t-2 border-b-2 border-ink py-5 flex items-center gap-6">
            <div className="font-headline text-4xl font-black text-newsprint-300 flex-shrink-0 leading-none">✦</div>
            <div>
              <p className="text-sm text-ink-muted italic leading-relaxed">
                위 신문들은 모두 실제로 발행된 꿈신문입니다. 주인공의 이름, 직업, 꿈을 입력하면 기자단이 같은 방식으로 당신의 이야기를 씁니다.
              </p>
              <p className="text-[11px] text-ink-muted mt-2 not-italic">— 꿈신문사 편집국</p>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── 마켓 TOP 3 ── */}
        {topTemplates.length > 0 && (
          <section className="py-12">
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-6">
              <div>
                <h2 className="font-headline text-xl font-bold uppercase tracking-wide">THE DREAM MARKET</h2>
                <p className="text-xs text-ink-muted italic mt-1">작가가 써둔 시리즈 — 내 이름을 넣으면 나만의 신문이 됩니다</p>
              </div>
              <Link href="/market" className="text-[11px] font-bold hover:underline tracking-widest uppercase">
                전체 보기 →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {topTemplates.map((t) => (
                <article key={t.id} className="border-2 border-ink bg-newsprint-50 hover:shadow-lg transition-shadow flex flex-col">
                  <div className="bg-ink text-newsprint-50 px-4 py-1 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.genre}</span>
                    <span className="text-[10px] font-bold">{t.duration_days}일 시리즈</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-headline text-lg font-bold mb-2 leading-tight">{t.title}</h3>
                    {t.preview_headline && (
                      <div className="border-l-4 border-ink pl-3 mb-4 flex-1">
                        <p className="font-serif italic text-xs leading-relaxed text-ink-muted line-clamp-3">
                          &ldquo;{t.preview_headline}&rdquo;
                        </p>
                      </div>
                    )}
                    <div className="text-[10px] text-ink-muted mb-4">
                      ✦ 슬롯 {t.slot_count}개 개인화 &nbsp;·&nbsp; {t.purchase_count}명 구매
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-ink/20">
                      <span className="font-headline text-xl font-black">
                        {t.price_krw === 0 ? "무료" : `₩${t.price_krw.toLocaleString()}`}
                      </span>
                      <Link
                        href={`/market/${t.id}`}
                        className="bg-ink text-newsprint-50 px-4 py-1.5 font-bold text-xs uppercase tracking-widest hover:bg-ink/80 transition-colors"
                      >
                        내 이름으로 →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/market"
                className="inline-block border-2 border-ink px-10 py-3 font-bold text-sm uppercase tracking-widest hover:bg-newsprint-200 transition-colors"
              >
                마켓 전체 둘러보기 →
              </Link>
            </div>
          </section>
        )}

        <Divider />

        {/* ── 꿈신문사에 대하여 ── */}
        <section className="py-14">
          <h2 className="font-headline text-xl font-bold uppercase tracking-wide border-b-2 border-ink pb-2 mb-10">꿈신문사에 대하여</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { n: "01", title: "꿈을 말씀해 주세요", desc: "이름, 원하는 직업, 기억에 남는 장면 하나. 거창하지 않아도 됩니다. 아직 형태가 없어도 됩니다." },
              { n: "02", title: "기자단이 그날을 씁니다", desc: "꿈신문사 기자단이 그 꿈이 이루어진 날을 현재진행형으로 기록합니다. 취재하듯, 목격하듯." },
              { n: "03", title: "매일 오전 8시, 신문이 옵니다", desc: "연재가 시작됩니다. 7일 동안 당신이 그 꿈 안에 살게 됩니다." },
            ].map((s) => (
              <div key={s.n} className="flex gap-5">
                <div className="font-headline text-5xl font-black text-newsprint-300 leading-none flex-shrink-0">{s.n}</div>
                <div>
                  <div className="font-bold text-sm uppercase tracking-wide mb-2">{s.title}</div>
                  <p className="text-xs text-ink-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 하단 CTA ── */}
        <section className="py-12 mb-10 border-t-4 border-b-4 border-ink text-center px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted mb-6">꿈신문사 편집국</p>
          <h2 className="font-headline text-4xl font-black mb-5 leading-tight text-ink">
            당신의 꿈은<br />어떤 기사가 될까요
          </h2>
          <p className="text-ink-muted text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            아직 이루어지지 않았기에 더 선명하게 쓸 수 있습니다.<br />
            꿈신문사는 그 날의 기억을 먼저 만들어 드립니다.
          </p>
          <Link href="/register" className="inline-block bg-ink text-newsprint-50 px-14 py-4 font-bold text-base uppercase tracking-widest hover:opacity-80 transition-opacity">
            내 신문 만들기
          </Link>
        </section>
      </main>

      <footer className="border-t-4 border-ink">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center text-[11px] text-ink-muted font-medium">
          <span>꿈신문사 © 2026</span>
          <span className="font-headline font-black tracking-widest text-ink">DREAM NEWSPAPER</span>
          <span>꿈신문사 기자단</span>
        </div>
      </footer>
    </div>
  );
}
