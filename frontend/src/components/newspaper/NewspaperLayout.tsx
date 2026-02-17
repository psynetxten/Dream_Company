"use client";

import { Newspaper } from "@/lib/api";

interface NewspaperLayoutProps {
  newspaper: Newspaper;
  protagonistName?: string;
}

export default function NewspaperLayout({
  newspaper,
  protagonistName,
}: NewspaperLayoutProps) {
  const stats = newspaper.sidebar_content?.stats || [];
  const quote = newspaper.sidebar_content?.quote;

  return (
    <article className="newspaper-page min-h-screen p-0">
      {/* ============================
          마스트헤드 (신문 상단 헤더)
          ============================ */}
      <header className="newspaper-masthead px-6">
        <div className="newspaper-date-line text-xs mb-2">
          <span>VOL. 1, NO. {newspaper.episode_number}</span>
          <span className="font-bold tracking-widest">꿈신문사</span>
          <span>DREAM NEWSPAPER</span>
        </div>
        <h1 className="newspaper-title text-ink">꿈신문사</h1>
        <p className="text-sm text-ink-muted mt-1 font-medium tracking-widest">
          DREAM NEWSPAPER — 당신의 꿈이 이루어진 날
        </p>
        <div className="newspaper-date-line mt-2">
          <span>발행인: 꿈신문사 AI 기자단</span>
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
            {/* 명언/인용구 */}
            {quote && (
              <div className="news-sidebar">
                <div className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-ink pb-1">
                  오늘의 한마디
                </div>
                <blockquote className="news-quote text-sm leading-relaxed">
                  {quote}
                </blockquote>
                {protagonistName && (
                  <p className="text-xs text-right mt-2 font-medium">
                    — {protagonistName}
                  </p>
                )}
              </div>
            )}

            {/* 성과 지표 */}
            {stats.length > 0 && (
              <div className="news-sidebar">
                <div className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-ink pb-1">
                  성과 지표
                </div>
                <div className="space-y-3">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-2xl font-bold text-ink">
                        {stat.value}
                      </div>
                      <div className="text-xs text-ink-muted">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 스폰서 배너 */}
            {newspaper.variables_used?.sponsor && (
              <div className="sponsor-banner">
                <div className="text-xs text-ink-muted mb-1">SPONSORED BY</div>
                <div className="text-sm font-bold">
                  {newspaper.variables_used.sponsor}
                </div>
              </div>
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
        <span>AI 기자단 발행</span>
      </footer>
    </article>
  );
}
