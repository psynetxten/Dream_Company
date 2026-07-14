"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STAGE_ORDER = ["starting", "sponsor_matching", "writing", "done"] as const;
type StageName = (typeof STAGE_ORDER)[number] | "idle" | "failed";

/* ──────────────────────────────────────────────
   타이핑 로그 훅
   — 메시지 큐에서 하나씩 꺼내 28ms 간격으로 타이핑
────────────────────────────────────────────── */
function useTypingLog() {
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState("");
  const targetRef = useRef("");
  const progressRef = useRef(0);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const target = targetRef.current;
      const progress = progressRef.current;

      if (progress < target.length) {
        progressRef.current = progress + 1;
        setCurrentText(target.slice(0, progress + 1));
      } else if (queueRef.current.length > 0) {
        if (target) setCompletedLines((l) => [...l, target]);
        const next = queueRef.current.shift()!;
        targetRef.current = next;
        progressRef.current = 0;
        setCurrentText("");
      }
    }, 55);
    return () => clearInterval(id);
  }, []);

  const enqueue = useCallback((msg: string) => {
    queueRef.current.push(msg);
  }, []);

  return { completedLines, currentText, enqueue };
}

/* ──────────────────────────────────────────────
   메인 컴포넌트
────────────────────────────────────────────── */
function GeneratingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const name = params.get("name") || "";
  const role = params.get("role") || "";

  const [stage, setStage] = useState<StageName>("idle");
  const [sponsorCompany, setSponsorCompany] = useState<string | null>(null);
  const [dreamCount, setDreamCount] = useState<number | null>(null);
  const [companions, setCompanions] = useState<{
    count: number;
    aspirations: { line: string; year: number }[];
    new_this_week: number;
  } | null>(null);
  const [showDreamCount, setShowDreamCount] = useState(false);
  const [failed, setFailed] = useState(false);

  const { completedLines, currentText, enqueue } = useTypingLog();
  const logEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

  // 로그 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [completedLines.length, currentText]);

  // 같은 미래를 향한 사람들 — 인원 + 비식별 열망 목록 조회
  useEffect(() => {
    fetch(`${apiUrl}/api/v1/orders/dream-companions?role=${encodeURIComponent(role || "")}`)
      .then((r) => r.json())
      .then((d) => {
        setCompanions(d);
        setDreamCount(typeof d.count === "number" ? d.count : null);
      })
      .catch(() => {});
  }, [role, apiUrl]);

  // SSE 연결
  useEffect(() => {
    if (!orderId) return;
    const es = new EventSource(`${apiUrl}/api/v1/orders/${orderId}/progress`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.stage === "ping") return;

      if (data.stage === "starting") {
        setStage("starting");
        enqueue("편집장이 꿈을 검토하고 있습니다...");
        enqueue("✓ 기사화 가치: 최상 ★★★★★");
        // sponsor_matching까지 ~26초 빈 구간 채우기
        enqueue("광고팀에 스폰서 탐색을 요청했습니다...");
        enqueue("전국 기업 데이터베이스 검색 중...");
        enqueue("산업군 · 미션 · 성장성 기준으로 필터링 중...");
        enqueue("꿈의 키워드와 기업 가치관 매칭 중...");
        enqueue("상위 후보군 선별 — 적합도 점수 산출 중...");
        enqueue("최종 스폰서를 선정하고 있습니다...");
      } else if (data.stage === "sponsor_matching") {
        const company = data.sponsor_company || null;
        setSponsorCompany(company);
        setStage("sponsor_matching");
        if (company) {
          enqueue(`👀 ${company}가 관심을 표명했습니다`);
        }
        setShowDreamCount(true);
      } else if (data.stage === "writing") {
        setStage("writing");
        // writing→done 사이 ~65초 빈 구간 채우기
        enqueue("수석 기자를 배정했습니다 — 취재 시작...");
        enqueue("미래 현장 묘사 작성 중...");
        enqueue("인터뷰 내용 구성 중...");
        enqueue("전문가 코멘트 삽입 중...");
        enqueue("헤드라인 · 서브헤드 조율 중...");
        enqueue("기사 전체 톤 및 밸런스 검토 중...");
        enqueue("SNS 배포 문구 작성 중...");
        enqueue("최종 교열 완료 중...");
      } else if (data.stage === "done") {
        setStage("done");
        enqueue("✓ 신문 완성! 잠시 후 이동합니다");
        es.close();
        setTimeout(() => {
          router.push(`/newspapers/${orderId}`);
        }, 3500);
      }
    };

    es.onerror = () => {
      setFailed(true);
      es.close();
    };

    const timeout = setTimeout(() => {
      setFailed(true);
      es.close();
    }, 5 * 60 * 1000);

    return () => {
      es.close();
      clearTimeout(timeout);
    };
  }, [orderId, apiUrl, router, enqueue]);

  const stageIdx = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);

  /* ── 실패 화면 ── */
  if (failed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0F0F0F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 24 }}>⚠️</div>
        <h2
          style={{
            color: "#F5F0E8",
            fontWeight: "bold",
            fontSize: 20,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          연결이 끊겼습니다
        </h2>
        <p
          style={{
            color: "#6B6869",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          신문은 편집국에서 계속 제작 중입니다.
          <br />
          잠시 후 대시보드에서 확인해 주세요.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "#F5F0E8",
            color: "#1A1A1A",
            padding: "14px 32px",
            borderRadius: 12,
            fontWeight: "bold",
            fontSize: 15,
            border: "none",
            cursor: "pointer",
          }}
        >
          대시보드에서 확인하기
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .cursor { animation: blink 1s step-end infinite; color: #CC2200; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0F0F0F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px 40px",
          gap: 20,
        }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "#CC2200",
              letterSpacing: "0.3em",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            DREAM NEWSPAPER 편집국
          </p>
          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 18,
              fontWeight: "bold",
              color: "#F5F0E8",
              fontFamily: "Georgia, 'Times New Roman', serif",
              lineHeight: 1.3,
            }}
          >
            {name ? `${name}의 꿈을 기사화하고 있습니다` : "꿈을 기사화하고 있습니다"}
          </h2>
        </div>

        {/* 편집국 실황 터미널 */}
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            background: "#1A1A1A",
            borderRadius: 12,
            border: "1px solid #2A2A2A",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid #2A2A2A",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#CC2200",
                display: "inline-block",
              }}
            />
            <span style={{ color: "#6B6869", fontSize: 10, letterSpacing: "0.15em" }}>
              편집국 실황
            </span>
            {stage !== "idle" && stage !== "done" && (
              <span
                style={{
                  marginLeft: "auto",
                  color: "#CC2200",
                  fontSize: 9,
                  fontWeight: "bold",
                  animation: "pulse 1.6s ease infinite",
                }}
              >
                ● LIVE
              </span>
            )}
            {stage === "done" && (
              <span
                style={{ marginLeft: "auto", color: "#5BB974", fontSize: 9, fontWeight: "bold" }}
              >
                ● 완료
              </span>
            )}
          </div>

          <div
            style={{
              padding: "14px 16px",
              minHeight: 100,
              maxHeight: 200,
              overflowY: "auto",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 12,
              lineHeight: 1.8,
            }}
          >
            {stage === "idle" && completedLines.length === 0 && !currentText && (
              <span style={{ color: "#9A968C" }}>
                편집국에 연결하는 중...<span className="cursor">|</span>
              </span>
            )}

            {completedLines.map((line, i) => (
              <div key={i} style={{ color: "#6B6869" }}>
                {line}
              </div>
            ))}

            {currentText && (
              <div style={{ color: "#F5F0E8" }}>
                {currentText}
                <span className="cursor">|</span>
              </div>
            )}

            <div ref={logEndRef} />
          </div>
        </div>

        {/* 스폰서 관심 카드 */}
        {sponsorCompany && (
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#1A1A1A",
              borderRadius: 12,
              border: "1px solid #CC2200",
              padding: "14px 16px",
              animation: "fadeIn 0.5s ease",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 9,
                color: "#CC2200",
                fontWeight: "bold",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              스폰서 관심
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>👀</span>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#F5F0E8",
                    fontWeight: "bold",
                    fontSize: 16,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {sponsorCompany}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#AEAAA5",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {name ? `${name}님의 기사에` : "이 기사에"} 스폰서로
                  <br />
                  참여를 검토하고 있습니다
                </p>
              </div>
            </div>
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #2A2A2A",
              }}
            >
              <p style={{ margin: 0, color: "#8A8880", fontSize: 10, lineHeight: 1.5 }}>
                협찬이 확정되면 기사 안에 자연스럽게 등장합니다 — 독자에게 광고처럼 느껴지지 않습니다
              </p>
            </div>
          </div>
        )}

        {/* 같은 미래를 향한 사람들 — 꿈 동료 공간 */}
        {showDreamCount && companions && (
          <div
            style={{
              width: "100%",
              maxWidth: 340,
              margin: "0 auto",
              padding: "16px 18px",
              border: "1px solid #2A2A2A",
              borderRadius: 12,
              background: "#141414",
              animation: "fadeIn 0.6s ease",
            }}
          >
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.18em", color: "#6A6A6A" }}>
              같은 미래를 향한 사람들
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.5, color: "#F5F0E8", fontFamily: "Georgia, serif" }}>
              {companions.count <= 1
                ? <>당신은 <span style={{ fontWeight: 700 }}>{role || "이 꿈"}</span>의<br />첫 번째 주인공입니다</>
                : <>당신처럼 <span style={{ fontWeight: 700 }}>‘{role}’</span>을<br />꿈꾸는 사람 <span style={{ fontWeight: 700 }}>{companions.count.toLocaleString()}명</span></>}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#8A8272" }}>
              당신의 꿈은 혼자가 아닙니다.
            </p>

            {companions.aspirations?.length > 0 && (
              <div style={{ marginTop: 14, borderTop: "1px solid #262626", paddingTop: 12, display: "flex", flexDirection: "column", gap: 9 }}>
                {companions.aspirations.slice(0, 4).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#6A6A6A", minWidth: 34, fontWeight: 700, fontFamily: "Georgia, serif" }}>{a.year}</span>
                    <span style={{ fontSize: 13, color: "#D8D2C4", fontFamily: "Georgia, serif" }}>{a.line}</span>
                  </div>
                ))}
              </div>
            )}

            {companions.new_this_week > 0 && (
              <p style={{ margin: "12px 0 0", fontSize: 11, color: "#6A6A6A" }}>
                이번 주, <span style={{ color: "#D8D2C4", fontWeight: 700 }}>{companions.new_this_week}명</span>이 새로 꿈을 시작했어요.
              </p>
            )}
          </div>
        )}

        {/* 진행 점 바 */}
        <div style={{ display: "flex", gap: 5, justifyContent: "center", alignItems: "center" }}>
          {STAGE_ORDER.map((s, i) => {
            const isPast = i < stageIdx;
            const isCurrent = i === stageIdx;
            return (
              <div
                key={s}
                style={{
                  height: 5,
                  width: isCurrent ? 22 : isPast ? 14 : 5,
                  borderRadius: 3,
                  background: isPast ? "#F5F0E8" : isCurrent ? "#CC2200" : "#2A2A2A",
                  transition: "all 0.5s ease",
                }}
              />
            );
          })}
        </div>

        {/* 완료 CTA */}
        {stage === "done" && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
            <p style={{ color: "#6B6869", fontSize: 12, margin: "0 0 14px" }}>
              3초 후 신문으로 이동합니다...
            </p>
            <button
              onClick={() => router.push(`/newspapers/${orderId}`)}
              style={{
                background: "#F5F0E8",
                color: "#1A1A1A",
                padding: "14px 36px",
                borderRadius: 12,
                fontWeight: "bold",
                fontSize: 15,
                border: "none",
                cursor: "pointer",
              }}
            >
              지금 바로 신문 보기 →
            </button>
          </div>
        )}

        {stage !== "done" && (
          <p style={{ color: "#8A8880", fontSize: 11, margin: 0 }}>
            보통 1~2분 소요됩니다
          </p>
        )}
      </div>
    </>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#0F0F0F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 48 }}>🗞️</div>
        </div>
      }
    >
      <GeneratingContent />
    </Suspense>
  );
}
