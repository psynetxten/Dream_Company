"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAndLogin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerAndLogin(form.email, form.password, form.full_name, "user", API_URL);
    } catch (err: any) {
      setError(err.message || "회원가입 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="newspaper-page w-full max-w-md p-8">

        <div className="text-center border-b-2 border-ink pb-4 mb-8">
          <Link href="/" className="font-headline text-3xl font-bold">꿈신문사</Link>
          <p className="text-sm text-ink-muted mt-1">독자 가입 — 내 꿈 신문 시작하기</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">이름</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="홍길동"
              required
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none"
            />
            <p className="text-xs text-ink-muted mt-1">최소 8자 이상</p>
          </div>

          {error && (
            <div className="border border-red-500 bg-red-50 p-2 text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-newsprint-50 py-3 font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50"
          >
            {loading ? "가입 중..." : "꿈 신문 시작하기"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-ink hover:underline">로그인</Link>
        </div>

        <div className="mt-4 pt-4 border-t border-ink/20 text-center text-xs text-ink-muted space-y-1">
          <p>글을 쓰고 싶으신가요? <Link href="/register/writer" className="font-bold text-ink hover:underline">작가로 지원하기 →</Link></p>
          <p>기업 광고 문의? <Link href="/register/sponsor" className="font-bold text-ink hover:underline">스폰서 등록하기 →</Link></p>
        </div>
      </div>
    </div>
  );
}
