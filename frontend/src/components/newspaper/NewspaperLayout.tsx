"use client";
import { Newspaper } from "@/lib/api";

interface NewspaperLayoutProps {
  newspaper: Newspaper;
  protagonistName?: string;
}

// ────────────────────────────────────────────
// 신문 광고 지면 컴포넌트
// ────────────────────────────────────────────
const AD_COPY_BY_INDUSTRY: Record<string, { tagline: string; cta: string }> = {
  "IT/소프트웨어":    { tagline: "미래를 코딩하는 사람들과 함께",         cta: "지금 채용 중" },
  "IT/AI/검색":      { tagline: "AI로 세상을 다시 정의합니다",            cta: "인재 모집" },
  "IT/클라우드/AI":  { tagline: "클라우드 위의 새로운 가능성",             cta: "커리어 시작" },
  "IT/플랫폼":       { tagline: "1억 명이 선택한 플랫폼의 동료가 되세요",  cta: "지원하기" },
  "금융/투자은행":   { tagline: "글로벌 금융의 중심에서",                  cta: "채용 안내" },
  "핀테크":          { tagline: "금융의 경계를 허물다",                    cta: "함께 성장" },
  "전기차/에너지/AI":{ tagline: "지속 가능한 미래를 함께 만듭니다",        cta: "합류하기" },
  "컨설팅":          { tagline: "세계 최고의 문제를 함께 풉니다",           cta: "지원 안내" },
  "게임":            { tagline: "글로벌 플레이어와 함께 만드는 세계",       cta: "채용 공고" },
  "이커머스/물류":   { tagline: "혁신적인 물류 생태계의 일원이 되세요",     cta: "지금 지원" },
};

const DEFAULT_AD = { tagline: "당신의 꿈을 현실로 만들 팀이 있습니다", cta: "채용 중" };

function NewspaperAd({
  companyName,
  industry,
  adCopy,
}: {
  companyName: string;
  industry?: string;
  adCopy?: string;
}) {
  const copy = (industry && AD_COPY_BY_INDUSTRY[industry]) || DEFAULT_AD;
  const displayCopy = adCopy
    ? adCopy.length > 60 ? adCopy.slice(0, 60) + "…" : adCopy
    : copy.tagline;

  return (
    <div className="border-4 border-double border-ink p-4 bg-newsprint-50 text-ink relative">
      {/* 광고 라벨 */}
      <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 bg-newsprint-100 px-2">
        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-ink-muted">광고</span>
      </div>

      {/* 장식 상단 라인 */}
      <div className="flex items-center gap-1 mb-3">
        <div className="flex-1 h-px bg-ink" />
        <span className="text-[8px] text-ink-muted">◆</span>
        <div className="flex-1 h-px bg-ink" />
      </div>

      {/* 기업명 */}
      <div className="text-center mb-2">
        <div className="font-headline text-2xl font-black uppercase tracking-tight leading-none">
          {companyName}
        </div>
        {industry && (
          <div className="text-[9px] uppercase tracking-widest text-ink-muted mt-1">{industry}</div>
        )}
      </div>

      {/* 광고 카피 */}
      <div className="border-t border-b border-ink/30 py-3 my-3 text-center">
        <p className="font-serif text-sm italic leading-relaxed text-ink">
          "{displayCopy}"
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <span className="inline-block border-2 border-ink px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
          {copy.cta}
        </span>
      </div>

      {/* 장식 하단 라인 */}
      <div className="flex items-center gap-1 mt-3">
        <div className="flex-1 h-px bg-ink" />
        <span className="text-[8px] text-ink-muted">◆</span>
        <div className="flex-1 h-px bg-ink" />
      </div>
    </div>
  );
}

export default function NewspaperLayout({
  newspaper,
  protagonistName,
}: NewspaperLayoutProps) {
  const stats = newspaper.sidebar_content?.stats || [];
  const quote = newspaper.sidebar_content?.quote;
  const sponsorName = newspaper.variables_used?.sponsor;
  const sponsorIndustry = newspaper.variables_used?.sponsor_industry;
  const sponsorReason = newspaper.variables_used?.sponsor_reason;

  // AI 프롬프트 기반 이미지 URL 생성 (Pollinations.ai)
  const imageUrl = newspaper.visual_prompt
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(newspaper.visual_prompt)}?width=800&height=450&nologo=true&seed=${newspaper.id.slice(0, 4)}`
    : null;

  return (
    <article className="newspaper-page min-h-screen p-0 pb-12 bg-newsprint-50">

      <div className="border-2 border-ink mx-4 mb-12 bg-newsprint-50">
        {/* ============================
            마스트헤드 (신문 상단 헤더)
            ============================ */}
        <header className="newspaper-masthead px-6">
          <div className="newspaper-date-line text-xs mb-2">
            <span>VOL. 1, NO. {newspaper.episode_number}</span>
            <span className="font-bold tracking-widest">꿈신문사</span>
            <span>DREAM NEWSPAPER</span>
          </div>
          <h1 className="newspaper-title">꿈신문사</h1>
          <p className="text-sm text-ink-muted mt-1 font-medium tracking-widest">
            DREAM NEWSPAPER — 당신의 꿈이 이루어진 날
          </p>
          <div className="newspaper-date-line mt-2">
            <span>발행인: 꿈신문사 기자단</span>
            <span className="font-bold text-base">
              {newspaper.future_date_label || newspaper.future_date}
            </span>
            <span>{newspaper.episode_number}편 / 연재 중</span>
          </div>
        </header>

        {/* ============================
            메인 콘텐츠
            ============================ */}
        <div className="p-8">
          {/* 헤드라인 */}
          <div className="border-b-2 border-ink pb-4 mb-6">
            <h2 className="news-headline">{newspaper.headline}</h2>
            {newspaper.subhead && (
              <p className="news-subhead">{newspaper.subhead}</p>
            )}
          </div>

          {/* 메인 이미지 (AI 생성) */}
          {imageUrl && (
            <div className="mb-8 border-4 border-ink shadow-xl overflow-hidden group">
              <img
                src={imageUrl}
                alt="Generated Dream Scene"
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="bg-ink text-newsprint-50 text-[10px] p-2 font-mono flex justify-between">
                <span>Latent Space Visualization: {newspaper.visual_prompt?.slice(0, 60)}...</span>
                <span className="text-pro-accent">DREAM SCENE</span>
              </div>
            </div>
          )}

          {/* 2컬럼 레이아웃 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 메인 기사 (2/3) */}
            <div className="col-span-2">
              {/* 리드 문단 */}
              {newspaper.lead_paragraph && (
                <div className="news-lead mb-6">
                  {newspaper.lead_paragraph}
                </div>
              )}

              {/* 구분선 */}
              <hr className="news-divider" />

              {/* 본문 */}
              {newspaper.body_content && (
                <div className="news-body">
                  {newspaper.body_content.split("\n\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 사이드바 (1/3) */}
            <div className="col-span-1 space-y-4">
              {/* 오늘의 한마디 — 다크 배경, 밝은 글자 */}
              {quote && (
                <div className="bg-ink text-newsprint-50 p-4 border-2 border-ink">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2 border-b border-newsprint-50/30 pb-1 text-newsprint-300">
                    오늘의 한마디
                  </div>
                  <blockquote className="text-sm italic leading-relaxed text-newsprint-50">
                    "{quote}"
                  </blockquote>
                  {protagonistName && (
                    <p className="text-[11px] text-right mt-2 text-newsprint-300">
                      — {protagonistName}
                    </p>
                  )}
                </div>
              )}

              {/* 성과 지표 — 흰 배경, 진한 테두리, 다크 글자 */}
              {stats.length > 0 && (
                <div className="bg-newsprint-50 text-ink border-2 border-ink p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-3 border-b-2 border-ink pb-1">
                    성과 지표
                  </div>
                  <div className="space-y-3">
                    {stats.map((stat, idx) => (
                      <div key={idx} className="text-center border-b border-ink/10 pb-2 last:border-0 last:pb-0">
                        <div className="text-2xl font-bold text-ink leading-tight">
                          {stat.value}
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 스폰서 광고 지면 */}
              {sponsorName && (
                <NewspaperAd
                  companyName={sponsorName}
                  industry={sponsorIndustry}
                  adCopy={sponsorReason}
                />
              )}
            </div>
          </div>
        </div>

        {/* 신문 하단 */}
        <footer className="newspaper-footer">
          <span>꿈신문사 © {new Date().getFullYear()}</span>
          <span>
            {newspaper.episode_number}편 ·{" "}
            {newspaper.future_date_label || newspaper.future_date}
          </span>
          <span>꿈신문사 편집국</span>
        </footer>
      </div>
    </article>
  );
}
