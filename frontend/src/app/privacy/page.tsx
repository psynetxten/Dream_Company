import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 꿈신문사",
  description: "꿈신문사 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F5F0E8]">
      <header className="border-b border-[#2A2A2A] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-[#CC2200] font-bold text-sm">← 홈으로</Link>
        <h1 className="font-bold text-lg">개인정보처리방침</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 text-sm leading-relaxed text-[#B0AAA4]">
        <p className="text-xs text-[#6B6869]">시행일: 2026년 4월 13일 · 최종 수정: 2026년 4월 13일</p>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">1. 개인정보의 수집 및 이용 목적</h2>
          <p>꿈신문사(이하 "회사")는 다음 목적으로 개인정보를 수집·이용합니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>회원 가입 및 서비스 제공</li>
            <li>꿈 신문 콘텐츠 생성 및 발행</li>
            <li>신문 발행 알림 발송</li>
            <li>고객 문의 응답</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">2. 수집하는 개인정보 항목</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-[#F5F0E8]">필수:</strong> 이메일 주소, 이름(닉네임)</li>
            <li><strong className="text-[#F5F0E8]">선택:</strong> 의뢰 내용(꿈 설명, 목표 직책/회사), 프로필 정보</li>
            <li><strong className="text-[#F5F0E8]">자동 수집:</strong> 기기 정보, 앱 사용 로그, IP 주소</li>
          </ul>
          <p>소셜 로그인(카카오, Google) 이용 시 해당 플랫폼으로부터 이메일·이름을 제공받습니다.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">3. 개인정보 보유 및 이용 기간</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>회원 탈퇴 시 즉시 파기 (단, 관계 법령에 따른 보존 기간 적용)</li>
            <li>전자상거래 등에서의 소비자 보호에 관한 법률: 계약·청약철회 기록 5년</li>
            <li>서비스 이용 로그: 3개월</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">4. 개인정보 제3자 제공</h2>
          <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래 경우는 예외입니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">5. 개인정보 처리 위탁</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-[#2A2A2A]">
              <thead>
                <tr className="bg-[#2A2A2A] text-[#F5F0E8]">
                  <th className="p-2 text-left">수탁업체</th>
                  <th className="p-2 text-left">위탁 업무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                <tr><td className="p-2">Supabase Inc.</td><td className="p-2">인증 및 데이터베이스 관리</td></tr>
                <tr><td className="p-2">Anthropic PBC</td><td className="p-2">AI 신문 콘텐츠 생성</td></tr>
                <tr><td className="p-2">Google LLC</td><td className="p-2">소셜 로그인, 클라우드 인프라</td></tr>
                <tr><td className="p-2">Kakao Corp.</td><td className="p-2">소셜 로그인</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">6. 이용자 권리</h2>
          <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>개인정보 열람·정정·삭제 요청</li>
            <li>개인정보 처리정지 요청</li>
            <li>회원 탈퇴를 통한 개인정보 파기 요청</li>
          </ul>
          <p>문의: <a href="mailto:privacy@dreamnewspaper.com" className="text-[#CC2200] underline">privacy@dreamnewspaper.com</a></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">7. 쿠키 및 유사 기술</h2>
          <p>서비스는 로그인 유지 및 사용자 경험 개선을 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">8. 개인정보 보호책임자</h2>
          <p>개인정보 보호 관련 문의, 불만 처리, 피해구제 등에 관한 사항은 아래에 연락하시기 바랍니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>담당자: 꿈신문사 개인정보보호팀</li>
            <li>이메일: <a href="mailto:privacy@dreamnewspaper.com" className="text-[#CC2200] underline">privacy@dreamnewspaper.com</a></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[#F5F0E8] font-bold text-base">9. 개정 고지</h2>
          <p>이 방침은 법령 변경 또는 서비스 변경에 따라 개정될 수 있습니다. 변경 시 앱 내 공지 또는 이메일로 7일 전 고지합니다.</p>
        </section>

        <div className="pt-4 border-t border-[#2A2A2A] text-xs text-[#6B6869]">
          <p>© 2026 꿈신문사. 관련 문의: <a href="mailto:hello@dreamnewspaper.com" className="text-[#CC2200]">hello@dreamnewspaper.com</a></p>
          <p className="mt-1"><Link href="/terms" className="text-[#CC2200] underline">이용약관 보기</Link></p>
        </div>
      </main>
    </div>
  );
}
