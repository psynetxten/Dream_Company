"use client";

import { useState } from "react";
import NewspaperLayout from "@/components/newspaper/NewspaperLayout";
import { Newspaper } from "@/lib/api";

// ── 샘플 1: 피아니스트 ──────────────────────────────────────
const SAMPLE_PIANIST: Newspaper = {
  id: "preview-0001",
  order_id: "preview-order",
  episode_number: 3,
  future_date: "2031-03-08",
  future_date_label: "2031년 3월 8일 토요일",
  headline: "피아니스트 김지우, 카네기홀을 침묵시키다",
  subhead: "데뷔 독주회 전석 매진 · 앙코르 도중 객석 곳곳에서 울음 — 《NYT》 '20년 만의 사건'",
  lead_paragraph:
    "3월 8일 오후 9시 47분, 뉴욕 카네기홀 메인홀의 조명이 완전히 꺼지고 나서도 관객 2,804명은 자리를 떠나지 않았다. 피아니스트 김지우(29)가 앙코르 세 번째 곡을 마친 지 11분이 지난 시각이었다. 무대 위에는 이미 아무것도 없었다.",
  body_content: `공연은 오후 8시 정각에 시작했다. 김지우가 무대에 등장했을 때 그의 손에는 악보가 없었다. 120분 분량의 프로그램 전체를 암보로 연주하겠다는 뜻이었다. 1열에 앉아 있던 피아니스트 랑랑은 나중에 SNS에 "앉는 순간부터 달랐다"고 적었다.

1부는 쇼팽의 발라드 1번으로 시작했다. 첫 소절에서 홀 전체가 조용해졌다. 단순히 조용한 것이 아니라 — 에어컨 소리, 좌석 삐걱거리는 소리, 모든 것이 멈춘 것 같은 느낌이었다고, 당시 현장에 있었던 《뉴욕 타임스》 음악 담당 데이나 코어스 기자는 전했다. 리스트 '초절기교 연습곡' 12번을 마쳤을 때 관객이 처음으로 박수를 쳤다. 연주 도중이었다.

2부가 끝나고 앙코르가 시작됐다. 첫 번째는 드뷔시 '달빛', 두 번째는 스크리아빈 소나타 5번. 세 번째 곡을 시작하기 전 김지우는 마이크 없이 말했다. "제가 쓴 곡인데, 제목은 아직 없어요." 7분 23초짜리 소품이었다. 나중에 알려진 바로는, 2026년 손목 인대 파열로 6개월 동안 피아노를 전혀 치지 못했던 시기에 완성한 곡이었다. 그 사실을 관객들이 알게 된 것은 공연이 끝난 다음 날 한 인터뷰를 통해서였다.

공연 후 대기실에서 코어스 기자가 "오늘 어땠냐"고 물었을 때 김지우의 첫마디는 "손이 많이 떨렸어요"였다.

《뉴욕 타임스》는 다음 날 아침 1면에 공연 리뷰를 실으며 "2011년 조성진 이후 카네기홀에서 목격한 가장 결정적인 피아노 데뷔"라고 썼다. 런던 로열 알버트홀과 도쿄 산토리홀 공연 티켓은 기사가 나간 뒤 4시간 만에 매진됐다.`,
  sidebar_content: {
    quote: "손이 많이 떨렸어요. 근데 그게 나쁜 건 아닌 것 같아요. 여전히 떨린다는 건, 아직 진심이라는 거니까.",
    stats: [
      { label: "기립 박수",    value: "11분"   },
      { label: "앙코르",       value: "3곡"    },
      { label: "NYT 리뷰",    value: "1면"    },
      { label: "다음 공연",    value: "매진"   },
    ],
    episode_summary: "카네기홀 데뷔 독주회 전석 매진, NYT 1면 리뷰",
  },
  variables_used: {
    protagonist: "김지우",
    company: "카네기홀",
    sponsor: "스타인웨이&선즈",
    sponsor_industry: "IT/소프트웨어",
    sponsor_reason: "오늘 밤 김지우의 손 아래 있었던 피아노는 스타인웨이입니다",
  },
  status: "published",
  published_at: "2031-03-08T08:00:00Z",
  view_count: 1284,
  visual_prompt:
    "Korean female pianist at Carnegie Hall, spotlight on her hands, audience in darkness, grand piano, photorealistic, intimate and emotional atmosphere",
  sns_copy: { instagram: "#꿈신문사 #피아니스트 #카네기홀" },
  ai_model: "gemini-2.5-pro",
};

// ── 샘플 2: 창업가 ──────────────────────────────────────────
const SAMPLE_FOUNDER: Newspaper = {
  id: "preview-0002",
  order_id: "preview-order-2",
  episode_number: 7,
  future_date: "2032-09-15",
  future_date_label: "2032년 9월 15일 수요일",
  headline: "루나랩스 박서준, 850억 투자 발표 직후 팀원들 앞에서 울었다",
  subhead: "소프트뱅크·세콰이아 공동 리드 — 기업가치 8,200억 · 창업 4년 · 직원 270명",
  lead_paragraph:
    "9월 15일 오전 11시, 서울 강남구 루나랩스 본사 6층 회의실. 박서준(34) 대표가 단상에 올라 첫 마디를 꺼내기까지 8초가 걸렸다. 850억 원 투자 유치 발표 자리였다. 그는 기자들이 아니라 뒤에 서 있는 팀원 270명을 먼저 바라봤다.",
  body_content: `"이 돈은 제 것이 아닙니다."

박서준이 말을 이었다. "여기 있는 사람들이 4년 동안 버텨준 덕분입니다." 그 자리에서 그는 잠깐 말을 멈췄다. 앞줄에 앉아 있던 초기 멤버 이소영 CTO는 나중에 "대표가 우는 걸 처음 봤다"고 했다.

루나랩스는 2028년 마포구 합정동 반지하 사무실에서 시작됐다. 박서준은 당시 대기업 물류팀 5년차 직원이었다. 퇴사 이유는 단순했다. "트럭의 30%가 매일 빈 채로 달립니다. 왜 아무도 이걸 고치려 하지 않냐고요." 그는 2026년 퇴사 후 2년간 코드만 짰다. 투자자 17곳에서 거절당했다. 한 VC는 미팅 중에 "물류는 IT로 해결 안 됩니다"라고 했다. 그 VC는 이번 라운드에 팔로우온으로 참여했다.

돌파구는 베트남이었다. 2029년 호찌민의 식품 유통업체 '프레시마트'와 6개월 무료 파일럿 계약을 맺었다. 결과는 배송 비용 28% 절감이었다. 그 데이터 하나로 시드 투자를 받았고, 이후 2년 만에 3개국 40개 플랫폼으로 확장했다.

핵심 기술은 AI 엔진 '오로라(Aurora)'다. 실시간 교통·날씨·수요 데이터를 통합해 배송 경로를 최적화한다. 도입 기업 평균 물류 비용 34% 절감. 숫자가 전부다.

세콰이아 캐피털 파트너 제시카 리는 투자를 결정한 이유를 짧게 설명했다. "오로라는 동남아 물류 인프라의 운영체제가 될 겁니다. 우리가 투자를 결정하는 데 걸린 시간은 72시간이었습니다."

발표가 끝난 뒤 복도에서 박서준에게 다음 목표를 물었다. "나스닥이요. 2033년." 그는 웃으며 덧붙였다. "거절했던 VC 중에 아직 안 온 곳이 13곳 있거든요."`,
  sidebar_content: {
    quote: "거절이 나를 단단하게 만들었습니다. 그리고 솔직히 말하면, 지금도 매일 두렵습니다. 그래서 매일 출근합니다.",
    stats: [
      { label: "투자 유치",   value: "850억"   },
      { label: "기업 가치",   value: "8,200억" },
      { label: "팀원",        value: "270명"   },
      { label: "VC 거절",     value: "17곳"    },
    ],
    episode_summary: "시리즈B 클로징 발표, 나스닥 2033년 목표 선언",
  },
  variables_used: {
    protagonist: "박서준",
    company: "루나랩스",
    sponsor: "소프트뱅크 비전펀드",
    sponsor_industry: "금융/투자은행",
    sponsor_reason: "미래를 바꿀 창업가를 가장 먼저 알아봅니다. 당신의 다음 라운드, 소프트뱅크와 함께",
  },
  status: "published",
  published_at: "2032-09-15T08:00:00Z",
  view_count: 3871,
  visual_prompt:
    "Korean male startup CEO standing before his 270-person team in a modern Seoul office, emotional moment, warm backlighting, photorealistic documentary style",
  sns_copy: { instagram: "#꿈신문사 #스타트업 #창업가" },
  ai_model: "gemini-2.5-pro",
};

const SAMPLES = [
  { key: "founder", label: "창업가", sub: "박서준 · AI 스타트업", data: SAMPLE_FOUNDER, name: "박서준" },
  { key: "pianist", label: "피아니스트", sub: "김지우 · 카네기홀", data: SAMPLE_PIANIST, name: "김지우" },
];

export default function PreviewPage() {
  const [active, setActive] = useState(0);
  const current = SAMPLES[active];

  return (
    <div>
      <div className="sticky top-0 z-50 bg-ink text-newsprint-50">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-pro-accent animate-pulse inline-block" />
            샘플 신문 프리뷰
          </div>
          <div className="flex gap-1">
            {SAMPLES.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActive(i)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
                  active === i
                    ? "bg-newsprint-50 text-ink border-newsprint-50"
                    : "border-newsprint-50/30 text-newsprint-300 hover:border-newsprint-50/60"
                }`}
              >
                <span>{s.label}</span>
                <span className="ml-2 text-[9px] opacity-60 normal-case font-normal">{s.sub}</span>
              </button>
            ))}
          </div>
          <div className="text-[10px] text-newsprint-400 italic">
            실제 발행 시 주인공 맞춤 생성
          </div>
        </div>
      </div>

      <NewspaperLayout
        key={current.key}
        newspaper={current.data}
        protagonistName={current.name}
      />
    </div>
  );
}
