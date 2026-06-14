"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import AppBar from "@/components/AppBar";

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || "");
      setName(data.user?.user_metadata?.full_name || "");
    });
  }, []);

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
