"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAndLogin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

const SPECIALTIES = [
  { key: "career", label: "커리어" },
  { key: "tech", label: "IT/기술" },
  { key: "startup", label: "스타트업" },
  { key: "sports", label: "스포츠" },
  { key: "arts", label: "예술/문화" },
  { key: "science", label: "과학" },
  { key: "business", label: "비즈니스" },
  { key: "social", label: "사회" },
];

export default function WriterRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    pen_name: "",
    bio: "",
  });
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSpecialty = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setError("전문 분야를 최소 1개 선택해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await registerAndLogin(form.email, form.password, form.full_name, "writer", API_URL);
    } catch (err: any) {
      setError(err.message || "지원 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-newsprint-50 px-4 py-12">
      <div className="max-w-lg mx-auto">

        {/* 헤더 */}
        <div className="text-center border-b-4 border-ink pb-6 mb-10">
          <Link href="/" className="font-headline text-3xl font-bold">꿈신문사</Link>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted mt-2">작가 지원서</p>
          <h1 className="font-headline text-2xl font-black mt-2">작가로 지원하기</h1>
          <p className="font-serif italic text-ink-muted text-sm mt-2">
            당신의 펜으로 누군가의 꿈이 헤드라인이 됩니다
          </p>
        </div>

        {/* 안내 박스 */}
        <div className="border-2 border-ink bg-newsprint-100 p-4 mb-8 flex gap-3">
          <span className="text-xl">✦</span>
          <div className="text-sm font-serif text-ink-muted leading-relaxed">
            꿈신문사 기자단은 독자의 꿈을 생생한 미래 신문으로 작성합니다.
            지원 즉시 작가 집무실이 열리며, 의뢰를 수락해 집필을 시작할 수 있습니다.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 기본 정보 */}
          <div className="space-y-4">
            <h2 className="font-headline font-bold text-sm uppercase tracking-widest border-b border-ink/30 pb-1">기본 정보</h2>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">실명</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="홍길동" required
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">이메일</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">비밀번호</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required minLength={8}
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100" />
              <p className="text-xs text-ink-muted mt-1">최소 8자 이상</p>
            </div>
          </div>

          {/* 작가 정보 */}
          <div className="space-y-4">
            <h2 className="font-headline font-bold text-sm uppercase tracking-widest border-b border-ink/30 pb-1">작가 정보</h2>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">필명 <span className="text-ink-muted font-normal normal-case">(독자에게 보이는 이름)</span></label>
              <input type="text" value={form.pen_name} onChange={(e) => setForm({ ...form, pen_name: e.target.value })}
                placeholder="꿈결 기자" required
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">전문 분야 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <button key={s.key} type="button" onClick={() => toggleSpecialty(s.key)}
                    className={`px-3 py-1 text-sm font-bold border-2 transition-colors ${
                      selected.includes(s.key) ? "bg-ink text-newsprint-50 border-ink" : "border-ink hover:bg-newsprint-200"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">자기소개</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="어떤 꿈을 가장 잘 쓸 수 있는지, 그리고 왜 꿈신문사 기자단에 지원하는지 알려주세요."
                rows={4}
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100 resize-none" />
            </div>
          </div>

          {error && (
            <div className="border border-red-500 bg-red-50 p-3 text-red-600 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-ink text-newsprint-50 py-4 font-headline font-bold text-lg uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50">
            {loading ? "지원서 제출 중..." : "✦ 작가로 지원하기"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-ink hover:underline">로그인</Link>
        </div>
      </div>
    </div>
  );
}
