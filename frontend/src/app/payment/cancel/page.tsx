"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="max-w-md w-full text-center">
      <div className="font-headline text-4xl font-black tracking-widest mb-10">꿈신문사</div>

      <div className="border-2 border-ink p-10">
        <div className="text-3xl mb-4">◇</div>
        <p className="font-headline text-xl font-bold mb-3">결제가 취소되었습니다</p>
        <p className="text-sm text-ink-muted mb-8 leading-relaxed">
          꿈은 여전히 기다리고 있습니다.<br />
          언제든지 다시 시작할 수 있습니다.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/order/new"
            className="bg-ink text-newsprint-50 py-3 font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity"
          >
            {orderId ? "다시 시도하기" : "의뢰서로 돌아가기"}
          </Link>
          <Link
            href="/dashboard"
            className="border-2 border-ink py-3 font-bold uppercase tracking-widest text-sm hover:bg-newsprint-200 transition-colors"
          >
            대시보드 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-newsprint-50 flex items-center justify-center p-8">
      <Suspense fallback={<div className="animate-pulse text-ink-muted">처리 중...</div>}>
        <CancelContent />
      </Suspense>
    </div>
  );
}
