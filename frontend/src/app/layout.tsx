import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "꿈신문사 - 당신의 꿈을 신문으로",
  description: "매일 아침, 당신의 꿈이 이루어진 미래를 신문으로 받아보세요.",
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
      </head>
      <body className="bg-newsprint-50 text-ink min-h-screen">{children}</body>
    </html>
  );
}
