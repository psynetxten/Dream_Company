import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PortalProvider } from "@/components/PortalProvider";

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
    title: "꿈신문사",
    description: "당신의 이름이 헤드라인을 장식하는 날",
    type: "website",
    locale: "ko_KR",
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
        <PortalProvider>
          {children}
        </PortalProvider>
      </body>
    </html>
  );
}
