"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAndLogin } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

const INDUSTRIES = [
  "IT/소프트웨어", "IT/AI/검색", "핀테크", "전기차/에너지/AI",
  "컨설팅", "금융/투자은행", "게임", "이커머스/물류",
  "의료/헬스케어", "교육", "미디어/콘텐츠", "기타",
];

export default function SponsorRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    company_name: "",
    industry: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.industry) { setError("업종을 선택해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      await registerAndLogin(form.email, form.password, form.full_name, "sponsor", API_URL);
    } catch (err: any) {
      setError(err.message || "등록 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-newsprint-50 px-4 py-12">
      <div className="max-w-lg mx-auto">

        {/* 헤더 */}
        <div className="text-center border-b-4 border-ink pb-6 mb-10">
          <Link href="/" className="font-headline text-3xl font-bold">꿈신문사</Link>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted mt-2">스폰서 센터</p>
          <h1 className="font-headline text-2xl font-black mt-2">스폰서 등록하기</h1>
          <p className="font-serif italic text-ink-muted text-sm mt-2">
            꿈을 가진 독자에게, 자연스럽게
          </p>
        </div>

        {/* 가치 제안 */}
        <div className="border-4 border-ink bg-ink text-newsprint-50 p-5 mb-8">
          <p className="font-headline text-sm font-bold uppercase tracking-widest mb-3">꿈신문사 광고가 다른 이유</p>
          <div className="space-y-2 text-xs font-serif text-newsprint-300 leading-relaxed">
            <p>✦ 독자의 꿈 기사 안에 브랜드가 자연스럽게 녹아듭니다 — 광고처럼 보이지 않습니다</p>
            <p>✦ AI가 꿈의 내용을 분석해 브랜드와 맞는 독자에게만 노출합니다</p>
            <p>✦ 독자의 꿈 = 그 기업의 미래 지원자 — 채용 브랜딩이 동시에 됩니다</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 담당자 정보 */}
          <div className="space-y-4">
            <h2 className="font-headline font-bold text-sm uppercase tracking-widest border-b border-ink/30 pb-1">담당자 정보</h2>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">담당자 이름</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="홍길동" required
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">업무 이메일</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@company.com" required
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

          {/* 기업 정보 */}
          <div className="space-y-4">
            <h2 className="font-headline font-bold text-sm uppercase tracking-widest border-b border-ink/30 pb-1">기업 정보</h2>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">회사명</label>
              <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="드림테크 주식회사" required
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">업종 <span className="text-red-500">*</span></label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100">
                <option value="">업종을 선택해주세요</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest mb-2">회사 소개</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="어떤 인재를 찾고 있는지, 어떤 꿈을 가진 독자에게 브랜드를 알리고 싶은지 알려주세요."
                rows={3}
                className="w-full border-2 border-ink bg-newsprint-50 px-4 py-2 font-serif focus:outline-none focus:bg-newsprint-100 resize-none" />
            </div>
          </div>

          {error && (
            <div className="border border-red-500 bg-red-50 p-3 text-red-600 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-ink text-newsprint-50 py-4 font-headline font-bold text-lg uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50">
            {loading ? "등록 중..." : "✦ 스폰서 센터 시작하기"}
          </button>

          <p className="text-xs text-ink-muted text-center font-serif italic">
            등록 즉시 스폰서 대시보드가 열리며, 광고 슬롯을 설정할 수 있습니다.
          </p>
        </form>

        <div className="mt-6 text-center text-sm text-ink-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-ink hover:underline">로그인</Link>
        </div>
      </div>
    </div>
  );
}
