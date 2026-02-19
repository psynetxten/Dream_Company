import { useEffect, useState } from "react";
import { Newspaper } from "@/lib/api";
import WorkflowNodes from "./WorkflowNodes";

interface NewspaperLayoutProps {
  newspaper: Newspaper;
  protagonistName?: string;
}

export default function NewspaperLayout({
  newspaper,
  protagonistName,
}: NewspaperLayoutProps) {
  const [isProMode, setIsProMode] = useState(true);
  const stats = newspaper.sidebar_content?.stats || [];
  const quote = newspaper.sidebar_content?.quote;

  // AI 프롬프트 기반 이미지 URL 생성 (Pollinations.ai)
  const imageUrl = newspaper.visual_prompt
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(newspaper.visual_prompt)}?width=800&height=450&nologo=true&seed=${newspaper.id.slice(0, 4)}`
    : null;

  useEffect(() => {
    if (isProMode) {
      document.body.classList.add("pro-dark");
    } else {
      document.body.classList.remove("pro-dark");
    }
    return () => document.body.classList.remove("pro-dark");
  }, [isProMode]);

  return (
    <article className="newspaper-page min-h-screen p-0 pb-12">
      {/* AI 워크플로우 시각화 */}
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[10px] font-mono text-pro-accent tracking-widest uppercase">
            // Generative Pipeline Active
          </div>
          <button
            onClick={() => setIsProMode(!isProMode)}
            className="text-[10px] font-mono border border-pro-border px-2 py-1 rounded hover:bg-pro-node-bg transition-colors"
          >
            {isProMode ? "Switch to Classic" : "Switch to AI-PRO"}
          </button>
        </div>
        <WorkflowNodes />
      </div>

      <div className="ai-pro-card mx-8 mb-12">
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
            <span>발행인: {newspaper.ai_model || "AI 기자단"}</span>
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
                <span className="text-pro-accent">AI-GENERATED</span>
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

              {/* SNS 홍보 툴박스 (마케팅 팀장 제작) */}
              {newspaper.sns_copy && (
                <div className="news-sidebar border-pro-accent/50 border-2">
                  <div className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-ink pb-1 flex justify-between">
                    <span>마케팅 툴박스</span>
                    <span className="text-pro-accent text-[8px]">BY 마케팅 팀장</span>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 bg-newsprint-100 border border-ink text-[10px] hover:bg-pro-accent hover:text-white transition-colors">
                      Instagram Copy 복사
                    </button>
                    <button className="w-full text-left p-2 bg-newsprint-100 border border-ink text-[10px] hover:bg-pro-accent hover:text-white transition-colors">
                      LinkedIn Post 복사
                    </button>
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
          <span>AI ENGINE: {newspaper.ai_model || "GEMINI"}</span>
        </footer>
      </div>
    </article>
  );
}
