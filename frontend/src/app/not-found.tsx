import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-6xl select-none">🗞️</div>

      <div className="text-center">
        <p className="font-bold text-[#CC2200] text-sm uppercase tracking-widest mb-2">404</p>
        <h1 className="font-bold text-white text-2xl leading-tight mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-[#6B6869] text-sm">
          이 페이지는 아직 신문에 실리지 않은 것 같아요
        </p>
      </div>

      <Link
        href="/"
        className="font-bold text-base rounded-2xl py-4 px-8 flex items-center justify-center transition-opacity active:opacity-75 bg-white text-[#1A1A1A]"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
