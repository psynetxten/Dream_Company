"use client";

import { useEffect } from "react";
import { useToast } from "@/components/Toast";

interface KakaoShareProps {
  title: string;
  description: string;
  linkUrl: string;
  imageUrl?: string;
  buttonLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

// Kakao 전역 타입 선언
declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (config: Record<string, unknown>) => void;
      };
    };
  }
}

export default function KakaoShareButton({
  title,
  description,
  linkUrl,
  imageUrl,
  buttonLabel = "카카오톡으로 공유",
  className,
  children,
}: KakaoShareProps) {
  const { success, info } = useToast();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!key || typeof window === "undefined" || !window.Kakao) return;
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }
  }, []);

  const handleShare = () => {
    const fullUrl = linkUrl.startsWith("http")
      ? linkUrl
      : `${window.location.origin}${linkUrl}`;

    const ogImage = imageUrl || `${window.location.origin}/api/og?title=${encodeURIComponent(title)}`;

    // 1순위: Kakao SDK
    if (window.Kakao?.Share) {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description,
          imageUrl: ogImage,
          link: { mobileWebUrl: fullUrl, webUrl: fullUrl },
        },
        buttons: [
          {
            title: "신문 읽기 📰",
            link: { mobileWebUrl: fullUrl, webUrl: fullUrl },
          },
        ],
      });
      return;
    }

    // 2순위: Web Share API (모바일 네이티브 공유 시트)
    if (navigator.share) {
      navigator.share({
        title,
        text: `📰 ${title}\n\n${description}\n\n꿈신문사에서 당신의 꿈도 신문이 됩니다 →`,
        url: fullUrl,
      }).catch(() => {
        // 공유 실패(데스크탑 미지원 / 사용자 취소 포함) → 클립보드 폴백
        navigator.clipboard
          .writeText(`${title}\n${description}\n\n${fullUrl}`)
          .then(() => success("링크가 복사됐어요! 친구에게 붙여넣기 해주세요 😊"))
          .catch(() => info(fullUrl));
      });
      return;
    }

    // 3순위: 클립보드 복사
    navigator.clipboard
      .writeText(`${title}\n${description}\n\n${fullUrl}`)
      .then(() => success("링크가 복사됐어요! 친구에게 붙여넣기 해주세요 😊"))
      .catch(() => info(fullUrl));
  };

  if (children) {
    return (
      <button onClick={handleShare} className={className}>
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={
        className ||
        "w-full font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 transition-opacity active:opacity-75"
      }
      style={className ? undefined : { minHeight: 56, background: "#FEE500", color: "#191919" }}
    >
      {/* 카카오 버블 아이콘 */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.763 1.847 5.19 4.621 6.498L5.43 21.64c-.067.248.167.46.388.312l4.985-3.324c.394.04.795.062 1.197.062 5.523 0 10-3.477 10-7.75C22 6.477 17.523 3 12 3z" />
      </svg>
      {buttonLabel}
    </button>
  );
}
