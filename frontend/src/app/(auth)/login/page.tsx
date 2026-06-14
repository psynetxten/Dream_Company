"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { setRoleCookie, getUserRole, roleToHome } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "로그인에 실패했습니다.");

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (sessionError) throw sessionError;

      const role = await getUserRole();
      setRoleCookie(role);

      const nextPath = searchParams.get("next");
      router.push(nextPath || roleToHome(role));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "로그인에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh bg-[#F4F3EE] flex flex-col px-6 pt-safe-top pb-safe-bottom overflow-hidden">
      {/* 뒤로가기 */}
      <div className="flex items-center pt-4 pb-2 flex-shrink-0">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center -ml-1 text-[#1A1A1A]"
          aria-label="홈으로"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      {/* 본문 */}
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full justify-between py-4">
        {/* 상단: 타이틀 + 폼 */}
        <div>
          {/* 로고 + 타이틀 */}
          <div className="mb-6">
            <p className="font-headline font-bold text-sm text-[#AEAAA5] mb-1">꿈신문사</p>
            <h1 className="font-headline font-bold text-3xl text-[#1A1A1A] leading-tight">
              다시 만나요
            </h1>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="이메일"
              required
              className="app-input"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="비밀번호"
              required
              className="app-input"
            />

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
                    로그인 중
                  </span>
                ) : (
                  "로그인"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 하단: 소셜 로그인 + 회원가입 */}
        <div>
          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E0DFD8]" />
            <span className="text-xs font-bold text-[#AEAAA5]">또는</span>
            <div className="flex-1 h-px bg-[#E0DFD8]" />
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: "kakao",
                  options: { redirectTo: `${window.location.origin}/` },
                })
              }
              className="w-full font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 transition-opacity active:opacity-75"
              style={{ minHeight: 52, background: "#FEE500", color: "#191919" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.763 1.847 5.19 4.621 6.498L5.43 21.64c-.067.248.167.46.388.312l4.985-3.324c.394.04.795.062 1.197.062 5.523 0 10-3.477 10-7.75C22 6.477 17.523 3 12 3z" />
              </svg>
              카카오로 계속하기
            </button>

            <button
              type="button"
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/` },
                })
              }
              className="app-btn-secondary gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              구글로 계속하기
            </button>
          </div>

          {/* 하단 링크 */}
          <p className="text-center text-sm text-[#6B6869] mt-5">
            계정이 없으신가요?{" "}
            <Link href="/register" className="font-bold text-[#1A1A1A] hover:underline">
              시작하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F3EE] flex items-center justify-center">
          <div className="skeleton h-8 w-32" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
