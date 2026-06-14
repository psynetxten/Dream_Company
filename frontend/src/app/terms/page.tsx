import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - 꿈신문사",
  description: "꿈신문사 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F5F0E8]">
      <header className="border-b border-[#2A2A2A] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-[#CC2200] font-bold text-sm">← 홈으로</Link>
        <h1 className="font-bold text-lg">이용약관</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 text-sm leading-relaxed text-[#B0AAA4]">
        <p className="text-xs text-[#6B6869]">시행일: 2026년 4월 13일 · 최종 수정: 2026년 4월 13일</p>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제1조 (목적)</h2>
          <p>이 약관은 꿈신문사(이하 "서비스")가 제공하는 AI 기반 꿈 신문 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제2조 (서비스 내용)</h2>
          <p>서비스는 다음을 제공합니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>사용자가 제출한 꿈·목표를 기반으로 AI가 생성하는 미래 신문 콘텐츠</li>
            <li>7일·14일·30일 시리즈 신문 구독 서비스</li>
            <li>매일 오전 8시(KST) 자동 발행 및 알림</li>
            <li>생성된 신문 열람·공유</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제3조 (회원 가입)</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>만 14세 이상이면 누구나 가입할 수 있습니다.</li>
            <li>이메일 또는 카카오·Google 계정으로 가입합니다.</li>
            <li>타인의 정보를 무단으로 사용해 가입하는 것은 금지됩니다.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제4조 (콘텐츠 및 지적재산권)</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>사용자가 제출한 꿈 의뢰 정보의 저작권은 사용자에게 있습니다.</li>
            <li>AI가 생성한 신문 콘텐츠의 저작권은 꿈신문사에 있으며, 사용자에게 개인적 열람·공유 권한을 부여합니다.</li>
            <li>생성된 콘텐츠를 상업적 목적으로 무단 사용하는 것은 금지됩니다.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제5조 (금지 행위)</h2>
          <p>다음 행위를 금지합니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>타인을 사칭하거나 허위 정보 제출</li>
            <li>서비스 시스템에 대한 해킹·바이러스 유포</li>
            <li>API를 무단으로 크롤링·자동화 도구로 대량 요청</li>
            <li>불법·음란·혐오 내용을 의뢰에 포함</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제6조 (서비스 중단 및 변경)</h2>
          <p>서비스는 시스템 점검, 기술적 문제 등으로 일시 중단될 수 있습니다. 장기 서비스 종료 시 30일 전 앱 내 공지합니다.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제7조 (면책 조항)</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>AI 생성 콘텐츠는 창작물이며 실제 사실이 아닙니다. 투자·진로 결정 등 실질적 판단의 근거로 사용하지 마십시오.</li>
            <li>서비스는 콘텐츠의 정확성을 보증하지 않습니다.</li>
            <li>사용자 간 또는 사용자와 제3자 간의 분쟁에 개입하지 않습니다.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">제8조 (준거법 및 분쟁 해결)</h2>
          <p>이 약관은 대한민국 법률에 따라 해석됩니다. 분쟁 발생 시 서울중앙지방법원을 전속 관할법원으로 합니다.</p>
        </section>

        <div className="pt-4 border-t border-[#2A2A2A] text-xs text-[#6B6869]">
          <p>© 2026 꿈신문사. 문의: <a href="mailto:hello@dreamnewspaper.com" className="text-[#CC2200]">hello@dreamnewspaper.com</a></p>
          <p className="mt-1"><Link href="/privacy" className="text-[#CC2200] underline">개인정보처리방침 보기</Link></p>
        </div>
      </main>
    </div>
  );
}
