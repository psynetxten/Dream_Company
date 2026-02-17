"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";

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
      const res = await authApi.login(form);
      Cookies.set("access_token", res.data.access_token, { expires: 1 });
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "로그인에 실패했습니다.");
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
