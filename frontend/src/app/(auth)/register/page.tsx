"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
      // Supabase 회원가입
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // 만약 이메일 확인이 필요없다면 바로 로그인 처리
        // 보통 Supabase 설정에서 "Confirm email"이 켜져있으면 바로 로그인 안됨
        if (data.session) {
          alert("회원가입이 완료되었습니다!");
          router.push("/dashboard");
        } else {
          alert("계정 생성이 완료되었습니다. 가입하신 이메일의 편지함에서 인증 메일을 확인해주세요!");
          router.push("/login");
        }
      }
    } catch (err: any) {
      setError(err.message || "회원가입에 실패했습니다.");
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
          <p className="text-sm text-ink-muted mt-1">회원가입</p>
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
