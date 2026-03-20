"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sponsorApi, SponsorCreate } from "@/lib/api";

const INDUSTRIES = [
  "IT/소프트웨어", "금융/핀테크", "의료/바이오", "교육", "제조/엔지니어링",
  "컨설팅", "미디어/엔터테인먼트", "게임", "이커머스/물류", "에너지/환경",
  "식품/유통", "패션/뷰티", "스타트업", "기타",
];

export default function SponsorRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SponsorCreate>({
    company_name: "",
    industry: "",
    description: "",
    website_url: "",
    contact_email: "",
    target_roles: [],
    target_companies: [],
    target_keywords: [],
  });

  const [roleInput, setRoleInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const addTag = (field: "target_roles" | "target_keywords", value: string, setter: (v: string) => void) => {
    const v = value.trim();
    if (!v) return;
    setForm((f) => ({ ...f, [field]: [...f[field], v] }));
    setter("");
  };

  const removeTag = (field: "target_roles" | "target_keywords", idx: number) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name) { setError("기업명을 입력하세요."); return; }
    setLoading(true);
    setError("");
    try {
      await sponsorApi.register(form);
      router.push("/sponsor/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-newsprint-50 text-ink p-8">
      <header className="max-w-3xl mx-auto border-b-4 border-ink pb-6 mb-12">
        <h1 className="font-headline text-5xl font-bold uppercase tracking-tighter">스폰서 등록</h1>
        <p className="text-sm text-ink-muted mt-2 italic">꿈신문사 광고 파트너가 되어 잠재 지원자에게 브랜드를 노출하세요.</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
        {/* 기업 기본 정보 */}
        <section className="border-2 border-ink p-6">
          <h2 className="font-headline text-xl font-bold mb-4 border-b border-ink pb-2">기업 기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">기업명 *</label>
              <input
                className="w-full border-2 border-ink p-2 bg-newsprint-100 font-serif focus:outline-none focus:bg-white"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="예: 삼성전자"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">산업군</label>
              <select
                className="w-full border-2 border-ink p-2 bg-newsprint-100 font-serif focus:outline-none"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                <option value="">선택...</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">기업 소개</label>
              <textarea
                className="w-full border-2 border-ink p-2 bg-newsprint-100 font-serif focus:outline-none focus:bg-white h-24 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="기업의 핵심 사업과 비전을 간략히 설명해주세요."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">웹사이트</label>
              <input
                className="w-full border-2 border-ink p-2 bg-newsprint-100 font-serif focus:outline-none focus:bg-white"
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">담당자 이메일</label>
              <input
                type="email"
                className="w-full border-2 border-ink p-2 bg-newsprint-100 font-serif focus:outline-none focus:bg-white"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="contact@company.com"
              />
            </div>
          </div>
        </section>

        {/* AI 타겟팅 설정 */}
        <section className="border-2 border-ink p-6">
          <h2 className="font-headline text-xl font-bold mb-2 border-b border-ink pb-2">AI 타겟팅 설정</h2>
          <p className="text-xs text-ink-muted italic mb-4">아래 정보를 바탕으로 AI가 관련 꿈을 가진 독자에게 자동 매칭합니다.</p>

          <div className="space-y-4">
            {/* 타겟 직업군 */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1">타겟 직업군</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border-2 border-ink p-2 bg-newsprint-100 font-serif focus:outline-none focus:bg-white"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("target_roles", roleInput, setRoleInput); } }}
                  placeholder="예: 소프트웨어 엔지니어"
                />
                <button type="button" onClick={() => addTag("target_roles", roleInput, setRoleInput)}
                  className="border-2 border-ink px-4 font-bold hover:bg-newsprint-200">추가</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.target_roles.map((r, i) => (
                  <span key={i} className="text-xs bg-ink text-newsprint-50 px-2 py-1 font-bold flex items-center gap-1">
                    {r} <button type="button" onClick={() => removeTag("target_roles", i)} className="hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* 키워드 */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1">관련 키워드</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border-2 border-ink p-2 bg-newsprint-100 font-serif focus:outline-none focus:bg-white"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("target_keywords", keywordInput, setKeywordInput); } }}
                  placeholder="예: AI, 스타트업, 글로벌"
                />
                <button type="button" onClick={() => addTag("target_keywords", keywordInput, setKeywordInput)}
                  className="border-2 border-ink px-4 font-bold hover:bg-newsprint-200">추가</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.target_keywords.map((k, i) => (
                  <span key={i} className="text-xs border border-ink px-2 py-1 flex items-center gap-1">
                    {k} <button type="button" onClick={() => removeTag("target_keywords", i)} className="hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && <p className="text-red-600 font-bold text-sm">{error}</p>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-ink text-newsprint-50 font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "등록 중..." : "스폰서 등록 완료"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="py-4 px-6 border-2 border-ink font-bold uppercase hover:bg-newsprint-200">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
