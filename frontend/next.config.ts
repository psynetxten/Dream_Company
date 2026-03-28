import type { NextConfig } from "next";

// BUILD_MODE=export  → Capacitor 앱용 정적 빌드 (npx cap sync)
// BUILD_MODE=        → Vercel 배포용 standalone 빌드 (기본값)
const isAppBuild = process.env.BUILD_MODE === "export";

const nextConfig: NextConfig = {
  output: isAppBuild ? "export" : "standalone",

  // 정적 내보내기 시 이미지 최적화 비활성화 (Capacitor WebView 호환)
  images: isAppBuild ? { unoptimized: true } : undefined,

  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003",
  },
};

export default nextConfig;
