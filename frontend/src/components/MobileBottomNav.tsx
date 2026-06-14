"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortal } from "@/components/PortalProvider";
import { signOut } from "@/lib/auth";

/* ─── SVG 아이콘 ─── */
function IconHome({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconNewspaper({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.15 : undefined}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line x1="7" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth={filled ? 2 : 1.8} strokeLinecap="round" />
      <line x1="7" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="16.5" x2="11" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPlusCircle({ filled }: { filled?: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle
        cx="14"
        cy="14"
        r="13"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line x1="14" y1="8" x2="14" y2="20" stroke={filled ? "white" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="14" x2="20" y2="14" stroke={filled ? "white" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconStar({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPerson({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="7"
        r="4"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.2 : undefined}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 21C3 16.582 7.029 13 12 13C16.971 13 21 16.582 21 21H3Z"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.2 : undefined}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPencil({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.15 : undefined}
      />
    </svg>
  );
}

function IconChart({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
      <rect x="10" y="7" width="4" height="14" rx="1" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/* ─── 탭 타입 ─── */
type Tab = {
  href: string;
  label: string;
  icon: (filled: boolean) => React.ReactNode;
  center?: boolean;
};

const USER_TABS: Tab[] = [
  { href: "/", label: "홈", icon: (f) => <IconHome filled={f} /> },
  { href: "/order/new", label: "의뢰", icon: (f) => <IconPlusCircle filled={f} />, center: true },
  { href: "/profile", label: "마이페이지", icon: (f) => <IconPerson filled={f} /> },
];

const WRITER_TABS: Tab[] = [
  { href: "/writer/dashboard", label: "집무실", icon: (f) => <IconPencil filled={f} /> },
  { href: "/writer/templates", label: "템플릿", icon: (f) => <IconNewspaper filled={f} /> },
  { href: "/", label: "홈", icon: (f) => <IconHome filled={f} /> },
];

const SPONSOR_TABS: Tab[] = [
  { href: "/sponsor/dashboard", label: "대시보드", icon: (f) => <IconChart filled={f} /> },
  { href: "/sponsor/slots", label: "슬롯", icon: (f) => <IconStar filled={f} /> },
  { href: "/", label: "홈", icon: (f) => <IconHome filled={f} /> },
];

const GUEST_TABS: Tab[] = [
  { href: "/", label: "홈", icon: (f) => <IconHome filled={f} /> },
  { href: "/login", label: "로그인", icon: (f) => <IconPerson filled={f} /> },
  { href: "/register", label: "시작하기", icon: (f) => <IconPlusCircle filled={f} />, center: true },
];

export default function MobileBottomNav() {
  const { portalType, isLoading } = usePortal();
  const pathname = usePathname();

  if (isLoading) return null;

  const isLoggedIn =
    portalType === "user" || portalType === "writer" || portalType === "sponsor";

  let tabs: Tab[];
  if (portalType === "writer") tabs = WRITER_TABS;
  else if (portalType === "sponsor") tabs = SPONSOR_TABS;
  else if (isLoggedIn) tabs = USER_TABS;
  else tabs = GUEST_TABS;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-[#E0DFD8]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-[60px] items-center">
        {tabs.map((tab) => {
          const active = isActive(tab.href);

          if (tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <span
                  className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  style={{ marginTop: -20 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                    <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span className="text-[9px] font-bold tracking-wide text-[#1A1A1A] mt-1 leading-none opacity-60">
                  의뢰
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? "text-[#1A1A1A]" : "text-[#AEAAA5]"
              }`}
            >
              {tab.icon(active)}
              <span className={`text-[9px] font-bold tracking-wide leading-none transition-all ${
                active ? "opacity-100" : "opacity-50"
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
