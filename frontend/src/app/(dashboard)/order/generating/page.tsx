"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STAGES = [
  { key: "starting", label: "편집국이 꿈을 분석하고 있습니다" },
  { key: "sponsor_matching", label: "맞춤 스폰서를 찾고 있습니다" },
  { key: "writing", label: "기자단이 기사를 작성하고 있습니다" },
  { key: "quality_check", label: "편집장이 검수하고 있습니다" },
  { key: "done", label: "신문이 완성됐습니다! 🎉" },
];

type StageKey = (typeof STAGES)[number]["key"];

function StageIcon({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#F5F0E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8L6.5 11.5L13 5"
            stroke="#1A1A1A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (state === "active") {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid #F5F0E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            border: "2px solid transparent",
            borderTop: "2px solid #F5F0E8",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "2px solid #3A3A3A",
        flexShrink: 0,
      }}
    />
  );
}

function GeneratingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [completedStages, setCompletedStages] = useState<StageKey[]>([]);
  const [currentStage, setCurrentStage] = useState<StageKey | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

  useEffect(() => {
    if (!orderId) return;

    const es = new EventSource(
      `${apiUrl}/api/v1/orders/${orderId}/progress`
    );

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.stage === "ping") return;

      if (data.stage === "done") {
        setCompletedStages(STAGES.map((s) => s.key as StageKey));
        setCurrentStage("done");
        setIsDone(true);
        es.close();
        setTimeout(() => {
          router.push(`/newspapers/${orderId}`);
        }, 3000);
      } else {
        const stageKey = data.stage as StageKey;
        setCurrentStage(stageKey);
        const idx = STAGES.findIndex((s) => s.key === stageKey);
        setCompletedStages(
          STAGES.slice(0, idx).map((s) => s.key as StageKey)
        );
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
  }, [orderId, apiUrl, router]);

  const getStageState = (key: StageKey): "done" | "active" | "pending" => {
    if (completedStages.includes(key)) return "done";
    if (currentStage === key) return "active";
    return "pending";
  };

  if (failed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1A1A1A",
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#1A1A1A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 48,
            animation: "fadeIn 0.5s ease",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🗞️</div>
          <h1
            style={{
              color: "#F5F0E8",
              fontSize: 24,
              fontWeight: "bold",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            꿈신문 제작 중
          </h1>
          <p
            style={{
              color: "#6B6869",
              fontSize: 14,
              marginTop: 8,
              animation: "pulse 2s ease infinite",
            }}
          >
            편집국이 열심히 당신의 신문을 만들고 있습니다
          </p>
        </div>

        {/* 단계 목록 */}
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            animation: "fadeIn 0.6s ease 0.1s both",
          }}
        >
          {STAGES.map((stage, idx) => {
            const state = getStageState(stage.key as StageKey);
            const isLast = idx === STAGES.length - 1;

            return (
              <div key={stage.key} style={{ display: "flex" }}>
                {/* 아이콘 + 연결선 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginRight: 16,
                  }}
                >
                  <StageIcon state={state} />
                  {!isLast && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 24,
                        background:
                          state === "done" ? "#F5F0E8" : "#2A2A2A",
                        margin: "4px 0",
                        transition: "background 0.4s ease",
                      }}
                    />
                  )}
                </div>

                {/* 텍스트 */}
                <div
                  style={{
                    paddingTop: 4,
                    paddingBottom: isLast ? 0 : 24,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: state === "active" ? "bold" : "normal",
                      color:
                        state === "done"
                          ? "#F5F0E8"
                          : state === "active"
                          ? "#F5F0E8"
                          : "#3A3A3A",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {stage.label}
                  </p>
                  {state === "active" && stage.key !== "done" && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#6B6869",
                        animation: "pulse 1.5s ease infinite",
                      }}
                    >
                      진행 중...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 완료 후 버튼 */}
        {isDone && (
          <div
            style={{
              marginTop: 48,
              textAlign: "center",
              animation: "fadeIn 0.5s ease",
            }}
          >
            <p style={{ color: "#6B6869", fontSize: 13, marginBottom: 16 }}>
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

        {/* 하단 안내 */}
        {!isDone && (
          <p
            style={{
              color: "#3A3A3A",
              fontSize: 12,
              marginTop: 48,
              textAlign: "center",
              animation: "fadeIn 0.6s ease 0.3s both",
            }}
          >
            보통 2~3분 소요됩니다
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
            background: "#1A1A1A",
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
