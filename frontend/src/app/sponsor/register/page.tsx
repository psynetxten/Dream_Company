"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sponsorApi, SponsorCreate } from "@/lib/api";
import { setRoleCookie } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const INDUSTRIES = [
  "IT/소프트웨어", "금융/핀테크", "의료/바이오", "교육", "제조/엔지니어링",
  "컨설팅", "미디어/엔터테인먼트", "게임", "이커머스/물류", "에너지/환경",
  "식품/유통", "패션/뷰티", "스타트업", "기타",
];

export default function SponsorRegisterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
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

  // 인증 확인 — 미로그인 시 로그인으로(의도 보존)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login?next=/sponsor/register");
        return;
      }
      setChecking(false);
    });
  }, [router]);

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
    if (!form.company_name.trim()) { setError("기업명을 입력해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      await sponsorApi.register(form);
      // 등록 성공 → 백엔드가 role을 sponsor로 승격. 쿠키도 갱신해야 가드 통과.
      setRoleCookie("sponsor");
      router.push("/sponsor/dashboard");
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e2.response?.data?.detail || e2.message || "등록 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-dvh bg-[#F4F3EE] flex items-center justify-center">
        <div className="skeleton h-8 w-32" />
      </div>
    );
  }

  /* 제거 가능한 태그 칩 */
  const TagChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 bg-[#1A1A1A] text-white text-xs font-bold pl-3 pr-2 py-1.5 rounded-full">
      {label}
      <button type="button" onClick={onRemove} className="opacity-70 hover:opacity-100 text-sm leading-none">×</button>
    </span>
  );

  return (
    <div className="min-h-dvh bg-[#F4F3EE] px-6 pt-safe-top pb-24">
      <div className="max-w-md mx-auto w-full">
        {/* 헤더 */}
        <div className="pt-8 pb-6">
          <p className="font-headline font-bold text-sm text-[#AEAAA5] mb-1">꿈신문사 스폰서</p>
          <h1 className="font-headline font-bold text-3xl text-[#1A1A1A] leading-tight">
            브랜드를<br />미래에 등장시키기
          </h1>
          <p className="text-sm text-[#6B6869] mt-2 leading-relaxed">
            독자의 꿈 기사 안에 브랜드가 자연스럽게 함께 등장합니다.<br />
            광고처럼 보이지 않으면서, 그 꿈을 꾸는 미래의 지원자에게 가닿습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기업 정보 */}
          <div className="space-y-4">
            <p className="app-section-label">기업 정보</p>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">기업명 <span className="text-[#CC2200]">*</span></label>
              <input
                className="app-input"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="예: 삼성전자"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">산업군</label>
              <select
                className="app-input"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                <option value="">선택...</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">기업 소개</label>
              <textarea
                className="app-input resize-none"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="기업의 핵심 사업과 비전을 간략히 알려주세요."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">웹사이트</label>
              <input
                className="app-input"
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">담당자 이메일</label>
              <input
                type="email"
                className="app-input"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="contact@company.com"
              />
            </div>
          </div>

          {/* 타겟팅 */}
          <div className="space-y-4">
            <div>
              <p className="app-section-label">타겟팅 설정</p>
              <p className="text-xs text-[#AEAAA5] mt-1">편집국이 관련 꿈을 가진 독자에게 맞춤 연결합니다.</p>
            </div>

            {/* 타겟 직업군 */}
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">타겟 직업군</label>
              <div className="flex gap-2">
                <input
                  className="app-input flex-1"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("target_roles", roleInput, setRoleInput); } }}
                  placeholder="예: 소프트웨어 엔지니어"
                />
                <button type="button" onClick={() => addTag("target_roles", roleInput, setRoleInput)}
                  className="px-5 rounded-2xl bg-[#F2F1EB] text-[#1A1A1A] font-bold text-sm border border-[#E0DFD8] active:bg-[#E8E6DE]">추가</button>
              </div>
              {form.target_roles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {form.target_roles.map((r, i) => (
                    <TagChip key={i} label={r} onRemove={() => removeTag("target_roles", i)} />
                  ))}
                </div>
              )}
            </div>

            {/* 키워드 */}
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">관련 키워드</label>
              <div className="flex gap-2">
                <input
                  className="app-input flex-1"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("target_keywords", keywordInput, setKeywordInput); } }}
                  placeholder="예: 스타트업, 글로벌, 친환경"
                />
                <button type="button" onClick={() => addTag("target_keywords", keywordInput, setKeywordInput)}
                  className="px-5 rounded-2xl bg-[#F2F1EB] text-[#1A1A1A] font-bold text-sm border border-[#E0DFD8] active:bg-[#E8E6DE]">추가</button>
              </div>
              {form.target_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {form.target_keywords.map((k, i) => (
                    <TagChip key={i} label={k} onRemove={() => removeTag("target_keywords", i)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-[#CC2200] px-1">{error}</p>}

          <button type="submit" disabled={loading} className="app-btn-primary disabled:opacity-50">
            {loading ? "등록 중..." : "스폰서 등록 완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
