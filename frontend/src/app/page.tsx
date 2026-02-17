import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ============================
          히어로 섹션
          ============================ */}
      <header className="newspaper-masthead px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center border-b-2 border-ink pb-4 mb-4">
            <p className="text-xs tracking-widest uppercase font-medium mb-2">
              창간호 · DREAM NEWSPAPER
            </p>
            <h1 className="font-headline text-6xl font-bold tracking-widest">
              꿈신문사
            </h1>
            <p className="text-lg text-ink-muted mt-2 italic">
              당신의 꿈이 이루어진 날을 신문으로 받아보세요
            </p>
          </div>
          <div className="flex justify-between items-center text-xs text-ink-muted">
            <span>매일 오전 8시 발행</span>
            <span className="font-bold">7일 · 14일 · 30일 시리즈</span>
            <span>AI 기자단 작성</span>
          </div>
        </div>
      </header>

      {/* ============================
          본문 섹션
          ============================ */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 서비스 소개 */}
        <section className="grid grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-headline text-3xl font-bold mb-4 border-b-2 border-ink pb-2">
              꿈신문사란?
            </h2>
            <div className="news-body">
              <p>
                꿈신문사는 당신이 되고 싶은 미래의 모습을 마치 이미 이루어진 것처럼,
                실제 신문 형태로 매일 배달해 드리는 서비스입니다.
              </p>
              <p>
                삼성전자 수석 개발자가 되고 싶으신가요?
                세계적인 피아니스트를 꿈꾸시나요?
                당신의 이름이 신문 헤드라인을 장식하는 그 날을,
                지금 이 순간부터 매일 느껴보세요.
              </p>
              <p>
                AI 기자단이 당신의 이름, 목표 회사,
                꿈의 직업을 변수로 삼아 생생한 미래 신문을
                매일 작성합니다.
              </p>
            </div>
          </div>

          {/* 미리보기 샘플 */}
          <div className="border-2 border-ink bg-newsprint-100 p-6">
            <div className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-ink pb-1">
              샘플 미리보기
            </div>
            <div className="text-xs text-ink-muted mb-3">2030년 3월 15일 토요일</div>
            <h3 className="font-headline text-xl font-bold mb-2 leading-tight">
              김철수, 삼성전자 AI 연구소장으로 취임
            </h3>
            <p className="text-sm italic text-ink-muted mb-3">
              &ldquo;10년의 여정이 오늘 결실을 맺었다&rdquo;
            </p>
            <p className="text-sm leading-relaxed">
              김철수(38) 박사가 삼성전자 AI 연구소장으로 공식 취임했다.
              서울대 컴퓨터공학 박사 출신인 김 소장은 지난 10년간
              반도체 AI 분야에서 독보적인 연구 성과를 쌓아왔으며...
            </p>
          </div>
        </section>

        {/* 구분선 */}
        <hr className="news-divider" />

        {/* 상품 구성 */}
        <section className="mb-16">
          <h2 className="font-headline text-3xl font-bold mb-6 text-center border-b-2 border-ink pb-2">
            시리즈 상품
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                days: 7,
                name: "일주일 체험",
                price: "9,900원",
                desc: "꿈의 시작을 알리는 7일간의 여정",
                highlight: false,
              },
              {
                days: 14,
                name: "2주 몰입",
                price: "17,900원",
                desc: "꿈이 성장하는 14일의 스토리",
                highlight: true,
              },
              {
                days: 30,
                name: "한 달 완성",
                price: "29,900원",
                desc: "꿈이 완성되는 30일 대서사시",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.days}
                className={`border-2 p-6 text-center ${
                  plan.highlight
                    ? "border-ink bg-ink text-newsprint-50"
                    : "border-ink bg-newsprint-100"
                }`}
              >
                <div className="font-headline text-4xl font-bold mb-1">
                  {plan.days}일
                </div>
                <div className="font-bold text-lg mb-2">{plan.name}</div>
                <div
                  className={`text-2xl font-bold mb-3 ${
                    plan.highlight ? "text-newsprint-200" : "text-ink"
                  }`}
                >
                  {plan.price}
                </div>
                <p className={`text-sm ${plan.highlight ? "text-newsprint-300" : "text-ink-muted"}`}>
                  {plan.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-2 border-ink bg-newsprint-100">
          <h2 className="font-headline text-3xl font-bold mb-4">
            지금 바로 꿈을 신문으로 받아보세요
          </h2>
          <p className="text-ink-muted mb-8 text-lg">
            가입 후 꿈을 의뢰하면, 내일 아침 첫 번째 꿈신문이 발행됩니다.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-ink text-newsprint-50 px-8 py-3 font-bold text-lg hover:bg-ink-light transition-colors"
            >
              무료 회원가입
            </Link>
            <Link
              href="/login"
              className="border-2 border-ink px-8 py-3 font-bold text-lg hover:bg-newsprint-200 transition-colors"
            >
              로그인
            </Link>
          </div>
        </section>

        {/* 작동 방식 */}
        <section className="mt-16">
          <h2 className="font-headline text-3xl font-bold mb-8 border-b-2 border-ink pb-2">
            어떻게 작동하나요?
          </h2>
          <div className="grid grid-cols-4 gap-6">
            {[
              { step: "01", title: "꿈 의뢰", desc: "이름, 목표 직업, 원하는 회사를 입력하세요" },
              { step: "02", title: "AI 기자 배정", desc: "AI 기자단이 당신만의 이야기를 설계합니다" },
              { step: "03", title: "매일 발행", desc: "매일 오전 8시, 당신의 꿈신문이 발행됩니다" },
              { step: "04", title: "꿈 체험", desc: "생생한 1인칭 미래 신문으로 꿈을 느끼세요" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="font-headline text-5xl font-bold text-ink-muted mb-2">
                  {item.step}
                </div>
                <div className="font-bold mb-2">{item.title}</div>
                <p className="text-sm text-ink-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="newspaper-footer max-w-5xl mx-auto mt-16 border-t-4 border-ink">
        <span>꿈신문사 © 2025</span>
        <span className="font-headline font-bold">DREAM NEWSPAPER</span>
        <span>AI 기자단 운영</span>
      </footer>
    </div>
  );
}
