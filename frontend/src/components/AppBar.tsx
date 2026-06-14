"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AppBarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  right?: React.ReactNode;
  transparent?: boolean;
}

export default function AppBar({ title, showBack, backHref, right, transparent }: AppBarProps) {
  const router = useRouter();
  return (
    /* 상태바(Safe Area Top) 영역을 배경색으로 덮고, 실제 콘텐츠는 h-14(56px) 안에 배치 */
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex flex-col ${
        transparent ? "" : "bg-[#F4F3EE]/95 backdrop-blur-md border-b border-[#E0DFD8]"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="h-14 flex items-center px-4 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={() => (backHref ? router.push(backHref) : router.back())}
              className="w-8 h-8 flex items-center justify-center -ml-1 text-[#1A1A1A]"
              aria-label="뒤로가기"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M12 4L6 10L12 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {/* title이 없고 back도 없을 때만 브랜드 로고 표시 */}
          {!showBack && !title && (
            <Link
              href="/"
              className="font-headline font-bold text-lg text-[#1A1A1A] tracking-tight"
            >
              꿈신문사
            </Link>
          )}
          {/* title이 있으면 showBack 여부와 무관하게 표시 */}
          {title && (
            <span className={`font-headline font-bold text-[#1A1A1A] truncate ${showBack ? "text-base" : "text-lg"}`}>
              {title}
            </span>
          )}
        </div>
        {right && (
          <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
        )}
      </div>
    </header>
  );
}
