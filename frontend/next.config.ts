import type { NextConfig } from "next";

// BUILD_MODE=export      → Capacitor 앱용 정적 빌드 (npx cap sync)
// BUILD_MODE=standalone  → Vercel/Railway 배포용 standalone 빌드
// BUILD_MODE=            → Docker 로컬 빌드 (next start, 빠른 빌드)
const isAppBuild = process.env.BUILD_MODE === "export";
const isStandalone = process.env.BUILD_MODE === "standalone";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isAppBuild ? "https://api.dreamnewspaper.com" : "http://localhost:3003");

const nextConfig: NextConfig = {
  output: isAppBuild ? "export" : isStandalone ? "standalone" : undefined,

  // 정적 export 시 동적 라우트 파라미터 없이 생성 허용
  ...(isAppBuild && {
    trailingSlash: true,
  }),

  // 정적 내보내기 시 이미지 최적화 비활성화 (Capacitor WebView 호환)
  images: isAppBuild ? { unoptimized: true } : undefined,

  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
};

export default nextConfig;
