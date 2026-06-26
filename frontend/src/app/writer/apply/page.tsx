"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setRoleCookie } from "@/lib/auth";
import { writerApi } from "@/lib/api";

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

export default function WriterApplyPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // 인증 확인 — 미로그인 시 로그인으로(의도 보존)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login?next=/writer/apply");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penName.trim()) { setError("필명을 입력해주세요."); return; }
    if (selected.length === 0) { setError("전문 분야를 최소 1개 선택해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      await writerApi.apply({ pen_name: penName.trim(), specialties: selected, bio: bio.trim() || undefined });
      // 서버가 role을 writer로 승격 → 쿠키도 갱신해야 가드 통과
      setRoleCookie("writer");
      router.push("/writer/dashboard");
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e2.response?.data?.detail || e2.message || "지원 중 오류가 발생했습니다.");
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

  return (
    <div className="min-h-dvh bg-[#F4F3EE] px-6 pt-safe-top pb-24">
      <div className="max-w-md mx-auto w-full">
        {/* 헤더 */}
        <div className="pt-8 pb-6">
          <p className="font-headline font-bold text-sm text-[#AEAAA5] mb-1">꿈신문사 기자단</p>
          <h1 className="font-headline font-bold text-3xl text-[#1A1A1A] leading-tight">
            기자단에<br />합류하기
          </h1>
          <p className="text-sm text-[#6B6869] mt-2 leading-relaxed">
            당신의 펜으로 누군가의 꿈이 헤드라인이 됩니다.<br />
            합류 즉시 집무실이 열리고, 의뢰를 수락해 집필을 시작할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 필명 */}
          <div>
            <label className="app-section-label block mb-2">필명 <span className="text-[#AEAAA5] font-normal normal-case">· 독자에게 보이는 이름</span></label>
            <input
              type="text"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              placeholder="예: 꿈결 기자"
              autoFocus
              className="app-input"
            />
          </div>

          {/* 전문 분야 */}
          <div>
            <label className="app-section-label block mb-2">전문 분야 <span className="text-[#CC2200]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => {
                const on = selected.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggle(s.key)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                      on
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-white text-[#6B6869] border-[#E0DFD8] active:bg-[#F2F1EB]"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 자기소개 */}
          <div>
            <label className="app-section-label block mb-2">자기소개 <span className="text-[#AEAAA5] font-normal normal-case">· 선택</span></label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="어떤 꿈을 가장 잘 쓸 수 있는지 알려주세요."
              rows={4}
              className="app-input resize-none"
            />
          </div>

          {error && <p className="text-sm text-[#CC2200] px-1">{error}</p>}

          <button type="submit" disabled={loading} className="app-btn-primary disabled:opacity-50">
            {loading ? "합류 처리 중..." : "기자단 합류하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
