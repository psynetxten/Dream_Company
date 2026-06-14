import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { PortalProvider } from "@/components/PortalProvider";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ToastProvider } from "@/components/Toast";

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "꿈신문사 - 당신의 꿈을 신문으로",
  description: "매일 아침, 당신의 꿈이 이루어진 미래를 신문으로 받아보세요.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "꿈신문사",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "꿈신문사 — 당신의 꿈이 헤드라인이 됩니다",
    description: "매일 아침 8시, 당신의 미래에서 신문이 도착합니다. 꿈신문사에서 당신의 이야기를 시작해보세요.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "꿈신문사" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "꿈신문사 — 당신의 꿈이 헤드라인이 됩니다",
    description: "매일 아침 8시, 당신의 미래에서 신문이 도착합니다.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* iOS Safe Area */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-newsprint-50 text-ink min-h-screen">
        {/* Kakao JavaScript SDK */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ToastProvider>
          <PortalProvider>
            {/* 모바일 하단 네비게이션 높이만큼 패딩 */}
            <div className="pb-safe-nav md:pb-0">
              {children}
            </div>
            <MobileBottomNav />
          </PortalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
