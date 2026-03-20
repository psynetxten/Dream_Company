"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const port = typeof window !== "undefined" ? window.location.port : "";
      const role = port === "3001" ? "writer" : port === "3002" ? "sponsor" : "user";

      console.log("Attempting Registration Proxy via authApi...", form, "role:", role);
      const res = await authApi.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role,
      });

      console.log("Registration Success Response:", res.data);
      alert("회원가입이 완료되었습니다! 로그인해 주세요.");
      router.push("/login");
    } catch (err: any) {
      console.error("Registration Error Caught:", err);
      // Axios 에러 처리
      const errorMsg = err.response?.data?.detail || err.message || "회원가입 중 오류가 발생했습니다.";
      setError(errorMsg);
      console.log("Setting UI error state:", errorMsg);
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
          <p className="text-sm text-ink-muted mt-1">회원가입 (v0.1.1)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">
              이름
            </label>
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
              minLength={8}
              className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none"
            />
            <p className="text-xs text-ink-muted mt-1">최소 8자 이상</p>
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
            {loading ? "가입 중..." : "회원가입 하기"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-ink hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
