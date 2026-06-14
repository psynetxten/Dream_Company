import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "당신의 꿈이 헤드라인이 됩니다";
  const name = searchParams.get("name") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#1A1A1A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          fontFamily: "serif",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "#CC2200",
              color: "#fff",
              fontSize: "18px",
              fontWeight: 700,
              padding: "6px 16px",
              borderRadius: "4px",
              letterSpacing: "0.05em",
            }}
          >
            꿈신문사
          </div>
          <div style={{ color: "#6B6869", fontSize: "16px" }}>
            DREAM NEWSPAPER
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {name && (
            <div
              style={{
                color: "#AEAAA5",
                fontSize: "22px",
                fontWeight: 500,
                letterSpacing: "0.05em",
              }}
            >
              {name}의 꿈신문
            </div>
          )}
          <div
            style={{
              color: "#F4F3EE",
              fontSize: title.length > 30 ? "42px" : "52px",
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
        </div>

        {/* 푸터 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #333",
            paddingTop: "24px",
          }}
        >
          <div style={{ color: "#6B6869", fontSize: "18px" }}>
            매일 아침 8시, 당신의 미래에서 도착합니다
          </div>
          <div
            style={{
              background: "#FEE500",
              color: "#191919",
              fontSize: "16px",
              fontWeight: 700,
              padding: "10px 24px",
              borderRadius: "999px",
            }}
          >
            지금 시작하기
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
