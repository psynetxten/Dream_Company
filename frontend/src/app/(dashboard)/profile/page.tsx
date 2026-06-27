"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { signOut, setRoleCookie, roleToHome } from "@/lib/auth";
import { authApi } from "@/lib/api";
import AppBar from "@/components/AppBar";

const ROLE_LABEL: Record<string, string> = {
  user: "독자",
  writer: "기자단",
  sponsor: "스폰서",
  admin: "관리자",
};

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [activeRole, setActiveRole] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || "");
      setName(data.user?.user_metadata?.full_name || "");
    });
    authApi.me()
      .then((r) => { setActiveRole(r.data?.role || ""); setRoles(r.data?.roles || []); })
      .catch(() => {});
  }, []);

  const handleSwitch = async (role: string) => {
    if (role === activeRole || switching) return;
    setSwitching(true);
    try {
      await authApi.setActiveRole(role);
      setRoleCookie(role);
      window.location.href = roleToHome(role);
    } catch {
      setSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <AppBar title="더보기" />

      <div className="pt-safe-header px-4 pb-safe-nav-lg max-w-sm mx-auto space-y-3">

        {/* 프로필 카드 */}
        <div className="app-card mt-4 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {name ? name[0] : email[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#1A1A1A] truncate">{name || "꿈 참여자"}</p>
            <p className="text-sm text-[#6B6869] truncate">{email}</p>
          </div>
        </div>

        {/* 역할 전환 — 2개 이상 보유 시만 표시 */}
        {roles.length > 1 && (
          <div className="app-card p-4">
            <p className="app-section-label mb-3">역할 전환</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const on = r === activeRole;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSwitch(r)}
                    disabled={switching}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors disabled:opacity-50 ${
                      on
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-white text-[#6B6869] border-[#E0DFD8] active:bg-[#F2F1EB]"
                    }`}
                  >
                    {ROLE_LABEL[r] || r}{on && " · 현재"}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#AEAAA5] mt-2.5">선택한 역할의 화면으로 이동합니다.</p>
          </div>
        )}

        {/* 내 콘텐츠 */}
        <div className="app-card divide-y divide-[#F4F3EE] p-0 overflow-hidden">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-4 py-4 active:bg-[#F4F3EE] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📰</span>
              <span className="text-sm font-medium text-[#1A1A1A]">내 꿈 시리즈</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#AEAAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="/order/new"
            className="flex items-center justify-between px-4 py-4 active:bg-[#F4F3EE] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">✍️</span>
              <span className="text-sm font-medium text-[#1A1A1A]">새 꿈 의뢰하기</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#AEAAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* 더 참여하기 — 아직 보유하지 않은 역할만 노출 */}
        {(!roles.includes("writer") || !roles.includes("sponsor")) && (
          <div>
            <p className="app-section-label mb-2 px-1">더 참여하기</p>
            <div className="app-card divide-y divide-[#F4F3EE] p-0 overflow-hidden">
              {!roles.includes("writer") && (
                <Link
                  href="/writer/apply"
                  className="flex items-center justify-between px-4 py-4 active:bg-[#F4F3EE] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🖋️</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">기자단으로 활동하기</p>
                      <p className="text-xs text-[#AEAAA5]">당신의 펜으로 누군가의 꿈을 신문에</p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="#AEAAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
              {!roles.includes("sponsor") && (
                <Link
                  href="/sponsor/register"
                  className="flex items-center justify-between px-4 py-4 active:bg-[#F4F3EE] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏢</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">브랜드 스폰서 되기</p>
                      <p className="text-xs text-[#AEAAA5]">미래를 꿈꾸는 독자에게 자연스럽게</p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="#AEAAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 지원 & 정보 */}
        <div className="app-card divide-y divide-[#F4F3EE] p-0 overflow-hidden">
          <a
            href="mailto:hello@dreamnewspaper.app"
            className="flex items-center justify-between px-4 py-4 active:bg-[#F4F3EE] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">💬</span>
              <span className="text-sm font-medium text-[#1A1A1A]">문의하기</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#AEAAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <Link
            href="/terms"
            className="flex items-center justify-between px-4 py-4 active:bg-[#F4F3EE] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <span className="text-sm font-medium text-[#1A1A1A]">이용약관</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#AEAAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 py-4 active:bg-[#F4F3EE] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔒</span>
              <span className="text-sm font-medium text-[#1A1A1A]">개인정보처리방침</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#AEAAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={() => signOut()}
          className="w-full app-card p-0 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-4 active:bg-[#FFF5F5] transition-colors">
            <span className="text-lg">🚪</span>
            <span className="text-sm font-medium text-[#CC2200]">로그아웃</span>
          </div>
        </button>

        <p className="text-center text-xs text-[#AEAAA5] pt-2">꿈신문사 v0.2.0</p>
      </div>
    </div>
  );
}
