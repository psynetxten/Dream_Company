"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAndLogin } from "@/lib/auth";
import AppBar from "@/components/AppBar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerAndLogin(form.email, form.password, form.full_name, "user", API_URL, "/onboarding");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col">
      <AppBar showBack backHref="/login" />

      <div className="pt-safe-header flex-1 flex flex-col px-6 py-6 max-w-sm mx-auto w-full">
        {/* 타이틀 */}
        <div className="mb-8 pt-2">
          <p className="font-headline font-bold text-sm text-[#AEAAA5] mb-1">꿈신문사</p>
          <h1 className="font-headline font-bold text-3xl text-[#1A1A1A] leading-tight">
            계정 만들기
          </h1>
          <p className="text-sm text-[#6B6869] mt-2">기자단에 합류하세요</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="이름"
            required
            className="app-input"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="이메일"
            required
            className="app-input"
          />
          <div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="비밀번호"
              required
              minLength={8}
              className="app-input"
            />
            <p className="text-xs text-[#AEAAA5] mt-1.5 px-1">최소 8자 이상</p>
          </div>

          {error && (
            <p className="text-sm text-[#CC2200] px-1">{error}</p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="app-btn-primary disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  가입 중
                </span>
              ) : (
                "시작하기"
              )}
            </button>
          </div>
        </form>

        {/* 하단 링크 */}
        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-[#6B6869]">
            이미 계정이 있어요?{" "}
            <Link href="/login" className="font-bold text-[#1A1A1A] hover:underline">
              로그인
            </Link>
          </p>

          <div className="app-divider" />

          <div className="flex justify-center gap-4 text-xs text-[#AEAAA5]">
            <Link href="/register/writer" className="hover:text-[#6B6869] transition-colors">
              작가로 지원하기 →
            </Link>
            <span>·</span>
            <Link href="/register/sponsor" className="hover:text-[#6B6869] transition-colors">
              스폰서 등록
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
