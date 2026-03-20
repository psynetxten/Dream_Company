import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "꿈신문사 - 당신의 꿈을 신문으로",
  description: "매일 아침, 당신의 꿈이 이루어진 미래를 신문으로 받아보세요.",
};

import { PortalProvider } from "@/components/PortalProvider";

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
        <script src="https://cdn.iamport.kr/v1/iamport.js" async></script>
      </head>
      <body className="bg-newsprint-50 text-ink min-h-screen">
        <PortalProvider>
          {children}
        </PortalProvider>
        <div style={{ display: 'none' }}>v0.1.2-multi-portal</div>
      </body>
    </html>
  );
}
