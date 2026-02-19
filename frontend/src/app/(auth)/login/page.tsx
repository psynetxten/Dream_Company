"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="newspaper-page w-full max-w-md p-8">
        <div className="text-center border-b-2 border-ink pb-4 mb-8">
          <Link href="/" className="font-headline text-3xl font-bold">
            꿈신문사
          </Link>
          <p className="text-sm text-ink-muted mt-1">로그인</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              이메일
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none"
            />
          </div>

          {error && (
            <div className="border border-red-500 bg-red-50 p-2 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-newsprint-50 py-3 font-bold uppercase tracking-widest hover:bg-ink-light transition-colors disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-ink-muted"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-ink-muted">
              또는 소셜 계정으로 로그인
            </span>
            <div className="flex-grow border-t border-ink-muted"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => {
                const redirectUrl = typeof window !== "undefined"
                  ? `${window.location.origin}/dashboard`
                  : "https://dream-newspaper-phi.vercel.app/dashboard";
                supabase.auth.signInWithOAuth({
                  provider: 'kakao',
                  options: { redirectTo: redirectUrl }
                });
              }}
              className="flex items-center justify-center gap-3 w-full bg-[#FEE500] text-[#191919] py-3 font-bold hover:bg-[#FADA0A] transition-colors border-2 border-ink"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.763 1.847 5.19 4.621 6.498L5.43 21.64c-.067.248.167.46.388.312l4.985-3.324c.394.04.795.062 1.197.062 5.523 0 10-3.477 10-7.75C22 6.477 17.523 3 12 3z" />
              </svg>
              카카오 로그인
            </button>

            <button
              onClick={() => {
                const redirectUrl = typeof window !== "undefined"
                  ? `${window.location.origin}/dashboard`
                  : "https://dream-newspaper-phi.vercel.app/dashboard";
                supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: redirectUrl }
                });
              }}
              className="flex items-center justify-center gap-3 w-full bg-newsprint-50 text-ink py-3 font-bold hover:bg-newsprint-100 transition-colors border-2 border-ink"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              구글 로그인
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-ink-muted">
          계정이 없으신가요?{" "}
          <Link href="/register" className="font-bold text-ink hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
