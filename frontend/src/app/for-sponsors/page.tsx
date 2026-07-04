"use client";

import { useState } from "react";
import { partnershipApi } from "@/lib/api";

export default function ForSponsorsPage() {
  const [form, setForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      setError("회사명·담당자명·이메일은 필수입니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await partnershipApi.inquire(form);
      setDone(true);
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e2.response?.data?.detail || e2.message || "문의 접수 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F4F3EE] px-6 pt-safe-top pb-24">
      <div className="max-w-md mx-auto w-full">
        {/* 헤더 */}
        <div className="pt-10 pb-8">
          <p className="font-headline font-bold text-sm text-[#AEAAA5] mb-1">꿈신문사 파트너십</p>
          <h1 className="font-headline font-bold text-3xl text-[#1A1A1A] leading-tight">
            브랜드를<br />누군가의 미래에
          </h1>
          <p className="text-sm text-[#6B6869] mt-3 leading-relaxed">
            꿈신문사는 사용자가 되고 싶은 미래를 1인칭 신문으로 매일 배달합니다.
            그 신문 안에 귀사의 브랜드가 광고가 아니라, 그 미래의 일부로 자연스럽게 등장합니다.
          </p>
        </div>

        {/* 가치 제안 */}
        <div className="space-y-3 mb-10">
          <div className="app-card p-4">
            <p className="font-bold text-[#1A1A1A] text-sm mb-1">광고가 아닌 등장</p>
            <p className="text-xs text-[#6B6869] leading-relaxed">
              "OO에 합격했습니다" 같은 기사 문장 속에 브랜드명이 자연스럽게 삽입됩니다. 배너가 아니라 서사입니다.
            </p>
          </div>
          <div className="app-card p-4">
            <p className="font-bold text-[#1A1A1A] text-sm mb-1">잠재 지원자에게 직접</p>
            <p className="text-xs text-[#6B6869] leading-relaxed">
              그 브랜드로 진출을 꿈꾸는 사용자에게만 노출됩니다. 꿈 자체가 타겟팅입니다.
            </p>
          </div>
          <div className="app-card p-4">
            <p className="font-bold text-[#1A1A1A] text-sm mb-1">7일부터 시작</p>
            <p className="text-xs text-[#6B6869] leading-relaxed">
              연재 시리즈 단위로 슬롯을 채웁니다. 초기 파트너에게는 협의된 조건으로 우선 제안드립니다.
            </p>
          </div>
        </div>

        {done ? (
          <div className="app-card p-6 text-center">
            <p className="text-2xl mb-2">✦</p>
            <p className="font-bold text-[#1A1A1A] mb-1">문의가 접수되었습니다</p>
            <p className="text-sm text-[#6B6869]">담당자가 확인 후 1~2영업일 내로 회신드리겠습니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="app-section-label">제휴 문의</p>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">회사명 <span className="text-[#CC2200]">*</span></label>
              <input
                className="app-input"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="예: 삼성전자"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">담당자명 <span className="text-[#CC2200]">*</span></label>
              <input
                className="app-input"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">이메일 <span className="text-[#CC2200]">*</span></label>
              <input
                type="email"
                className="app-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">연락처</label>
              <input
                className="app-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6869] mb-1.5">문의 내용</label>
              <textarea
                className="app-input resize-none"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="궁금하신 점이나 희망하시는 타겟을 알려주세요."
              />
            </div>

            {error && <p className="text-sm text-[#CC2200] px-1">{error}</p>}

            <button type="submit" disabled={loading} className="app-btn-primary disabled:opacity-50">
              {loading ? "접수 중..." : "제휴 문의하기"}
            </button>

            <p className="text-center text-xs text-[#AEAAA5] pt-2">
              이미 계정이 있고 바로 슬롯을 설정하고 싶다면{" "}
              <a href="/sponsor/register" className="underline text-[#6B6869]">스폰서 등록</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
