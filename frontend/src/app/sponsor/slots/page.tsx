"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { paymentApi } from "@/lib/api";

// ─── 단가 정의 (CTO 결정 2026-05-19) ───────────────────────────
// 네이티브 본문 삽입: 100원/노출 (꿈 직군 완전 일치 타겟팅 프리미엄)
// 사이드바 광고 박스: 30원/노출 (네이버 디스플레이 수준)
const PRICE_NATIVE  = 100; // 원/노출
const PRICE_SIDEBAR = 30;  // 원/노출

const PACKAGES = [
  {
    id: "pilot",
    name: "파일럿",
    badge: "첫 시작",
    badgeColor: "#6B6869",
    native: 50,
    sidebar: 50,
    get price() { return this.native * PRICE_NATIVE + this.sidebar * PRICE_SIDEBAR; },
    desc: "효과 검증용 소량 패키지",
  },
  {
    id: "standard",
    name: "스탠다드",
    badge: "추천",
    badgeColor: "#CC2200",
    native: 300,
    sidebar: 300,
    get price() { return this.native * PRICE_NATIVE + this.sidebar * PRICE_SIDEBAR; },
    desc: "월 정기 집행에 적합",
  },
  {
    id: "premium",
    name: "프리미엄",
    badge: "독점 직군",
    badgeColor: "#1A1A1A",
    native: 1000,
    sidebar: 1000,
    get price() { return this.native * PRICE_NATIVE + this.sidebar * PRICE_SIDEBAR; },
    desc: "직군 독점 타겟팅 포함",
  },
] as const;

export default function SponsorSlotsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [nativeQty, setNativeQty] = useState(50);
  const [sidebarQty, setSidebarQty] = useState(50);
  const [nativeText, setNativeText] = useState("");
  const [sidebarText, setSidebarText] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<string | null>("pilot");

  const totalPrice = nativeQty * PRICE_NATIVE + sidebarQty * PRICE_SIDEBAR;

  const applyPackage = (pkg: typeof PACKAGES[number]) => {
    setSelectedPkg(pkg.id);
    setNativeQty(pkg.native);
    setSidebarQty(pkg.sidebar);
  };

  const handleQtyChange = () => setSelectedPkg("custom");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nativeQty > 0 && !nativeText.trim()) {
      setError("본문에 삽입할 기업명을 입력하세요.");
      return;
    }
    if (nativeQty === 0 && sidebarQty === 0) {
      setError("구매 수량을 1회 이상 설정하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await paymentApi.createSponsorCheckout({
        native_qty: nativeQty,
        native_text: nativeText.trim(),
        sidebar_qty: sidebarQty,
        sidebar_text: sidebarText.trim(),
      });
      window.location.href = res.data.checkout_url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "결제 세션 생성에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-newsprint-50 text-ink p-6 md:p-8">
      <header className="max-w-3xl mx-auto border-b-4 border-ink pb-6 mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-tighter">
          광고 슬롯 구매
        </h1>
        <p className="text-sm text-ink-muted mt-2 italic">
          독자의 꿈 기사에 브랜드를 자연스럽게 삽입합니다.
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">

        {/* 단가 안내 */}
        <section className="border-2 border-ink bg-newsprint-100 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3">광고 단가</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-3xl font-bold">100원</span>
                <span className="text-xs text-ink-muted">/ 노출</span>
              </div>
              <div className="text-sm font-bold mt-0.5">① 네이티브 본문 삽입</div>
              <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                기사 본문에 기업명이 자연 등장. 꿈 직군 일치 독자에게만 노출.
              </div>
            </div>
            <div className="border-l border-ink/20 pl-4">
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-3xl font-bold">30원</span>
                <span className="text-xs text-ink-muted">/ 노출</span>
              </div>
              <div className="text-sm font-bold mt-0.5">② 사이드바 광고 박스</div>
              <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                신문 우측에 기업명·카피·CTA 포함 클래식 광고 박스.
              </div>
            </div>
          </div>
        </section>

        {/* 패키지 선택 */}
        <section>
          <h2 className="font-headline text-xl font-bold mb-4">패키지 선택</h2>
          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => applyPackage(pkg)}
                className={`text-left border-2 p-4 transition-all ${
                  selectedPkg === pkg.id
                    ? "border-ink bg-ink text-newsprint-50"
                    : "border-ink/40 hover:border-ink bg-newsprint-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wide"
                    style={{
                      background: selectedPkg === pkg.id ? "rgba(255,255,255,0.2)" : pkg.badgeColor,
                      color: selectedPkg === pkg.id ? "#F5F0E8" : "#F5F0E8",
                    }}
                  >
                    {pkg.badge}
                  </span>
                </div>
                <div className="font-headline text-lg font-bold">{pkg.name}</div>
                <div className={`text-xs mt-1 ${selectedPkg === pkg.id ? "text-newsprint-300" : "text-ink-muted"}`}>
                  {pkg.desc}
                </div>
                <div className={`text-xs mt-2 space-y-0.5 ${selectedPkg === pkg.id ? "text-newsprint-200" : "text-ink/60"}`}>
                  <div>네이티브 {pkg.native.toLocaleString()}회</div>
                  <div>사이드바 {pkg.sidebar.toLocaleString()}회</div>
                </div>
                <div className={`font-headline text-xl font-bold mt-3 ${selectedPkg === pkg.id ? "text-newsprint-50" : "text-ink"}`}>
                  {pkg.price.toLocaleString()}원
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 수량 커스텀 */}
        <section className="border-2 border-ink p-5 space-y-5">
          <h2 className="font-headline text-xl font-bold border-b border-ink pb-2">
            수량 조정
            {selectedPkg === "custom" && (
              <span className="text-xs font-normal text-ink-muted ml-2">(커스텀)</span>
            )}
          </h2>

          {/* 네이티브 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase">① 네이티브 노출 횟수</label>
              <span className="font-headline text-xl font-bold">{nativeQty.toLocaleString()}회</span>
            </div>
            <input
              type="range" min="0" max="2000" step="50"
              value={nativeQty}
              onChange={(e) => { setNativeQty(+e.target.value); handleQtyChange(); }}
              className="w-full accent-ink"
            />
            <div className="flex justify-between text-[10px] text-ink-muted mt-0.5">
              <span>0회</span><span>2,000회</span>
            </div>
            <div className="text-xs text-ink-muted mt-1">
              소계: <span className="font-bold text-ink">{(nativeQty * PRICE_NATIVE).toLocaleString()}원</span>
            </div>
          </div>

          {/* 사이드바 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase">② 사이드바 노출 횟수</label>
              <span className="font-headline text-xl font-bold">{sidebarQty.toLocaleString()}회</span>
            </div>
            <input
              type="range" min="0" max="2000" step="50"
              value={sidebarQty}
              onChange={(e) => { setSidebarQty(+e.target.value); handleQtyChange(); }}
              className="w-full accent-ink"
            />
            <div className="flex justify-between text-[10px] text-ink-muted mt-0.5">
              <span>0회</span><span>2,000회</span>
            </div>
            <div className="text-xs text-ink-muted mt-1">
              소계: <span className="font-bold text-ink">{(sidebarQty * PRICE_SIDEBAR).toLocaleString()}원</span>
            </div>
          </div>

          {/* 합계 */}
          <div className="border-t-2 border-ink pt-4 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold uppercase text-ink-muted">견적 합계</div>
              <div className="text-xs text-ink-muted mt-0.5">
                VAT 별도 · 슬롯 활성화 후 청구서 발행
              </div>
            </div>
            <div className="font-headline text-3xl font-bold">{totalPrice.toLocaleString()}원</div>
          </div>
        </section>

        {/* 광고 문구 설정 */}
        <form onSubmit={handleSubmit} className="border-2 border-ink p-5 space-y-5">
          <h2 className="font-headline text-xl font-bold border-b border-ink pb-2">광고 문구 설정</h2>

          {nativeQty > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                ① 본문에 삽입할 기업명 / 브랜드명 *
              </label>
              <input
                className="w-full border-2 border-ink p-3 bg-newsprint-100 font-serif text-lg focus:outline-none focus:bg-white"
                value={nativeText}
                onChange={(e) => setNativeText(e.target.value)}
                placeholder="예: 드림테크 주식회사"
              />
              <p className="text-xs text-ink-muted mt-1">
                기사 본문에 자연스럽게 등장할 기업명 또는 브랜드명입니다.
              </p>
            </div>
          )}

          {sidebarQty > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase mb-1">
                ② 사이드바 광고 문구 (선택)
              </label>
              <input
                className="w-full border-2 border-ink p-3 bg-newsprint-100 font-serif focus:outline-none focus:bg-white"
                value={sidebarText}
                onChange={(e) => setSidebarText(e.target.value)}
                placeholder="예: AI로 세상을 다시 정의합니다"
              />
              <p className="text-xs text-ink-muted mt-1">
                비워두면 업종별 자동 카피가 적용됩니다.
              </p>
            </div>
          )}

          {error && (
            <div className="border border-red-400 bg-red-50 p-3 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="border border-green-400 bg-green-50 p-3 text-green-700 text-sm">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading || (nativeQty === 0 && sidebarQty === 0)}
            className="w-full py-4 bg-ink text-newsprint-50 font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-40"
          >
            {loading
              ? "Stripe로 이동 중..."
              : `결제하기 — ${totalPrice.toLocaleString()}원`}
          </button>

          <p className="text-[10px] text-ink-muted text-center">
            Stripe 보안 결제 페이지로 이동합니다.
            결제 완료 후 다음 발행 사이클부터 노출이 시작됩니다.
          </p>
        </form>

        <button
          onClick={() => router.push("/sponsor/dashboard")}
          className="text-sm font-bold hover:underline"
        >
          ← 대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
}
