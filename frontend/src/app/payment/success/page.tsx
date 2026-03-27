"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { paymentApi, ordersApi } from "@/lib/api";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "starting" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) { setStatus("error"); setErrorMsg("세션 정보가 없습니다."); return; }

    const run = async () => {
      try {
        // 1. session_id → order_id + 결제 상태 확인
        const sessionRes = await paymentApi.getSession(sessionId);
        const { order_id, payment_status } = sessionRes.data;

        if (payment_status !== "paid") {
          // 웹훅이 아직 안 왔을 수 있음 — 3초 후 재시도
          await new Promise((r) => setTimeout(r, 3000));
          const retry = await paymentApi.getSession(sessionId);
          if (retry.data.payment_status !== "paid") {
            setStatus("error");
            setErrorMsg("결제 확인 중입니다. 잠시 후 대시보드를 확인해주세요.");
            return;
          }
        }

        // 2. 의뢰 시작
        setStatus("starting");
        await ordersApi.start(order_id);
        setStatus("done");
        setTimeout(() => router.push("/dashboard"), 3000);
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.response?.data?.detail || err.message || "오류가 발생했습니다.");
      }
    };

    run();
  }, [searchParams, router]);

  return (
    <div className="max-w-md w-full text-center">
      <div className="font-headline text-4xl font-black tracking-widest mb-10">꿈신문사</div>

      {status === "loading" && (
        <div className="border-2 border-ink p-10">
          <div className="text-3xl mb-4 animate-pulse">✦</div>
          <p className="font-bold text-lg mb-2">결제를 확인하는 중입니다</p>
          <p className="text-sm text-ink-muted">잠시만 기다려주세요...</p>
        </div>
      )}

      {status === "starting" && (
        <div className="border-2 border-ink p-10">
          <div className="text-3xl mb-4">✒</div>
          <p className="font-bold text-lg mb-2">신문 연재를 준비하고 있습니다</p>
          <p className="text-sm text-ink-muted">내일 오전 8시 첫 번째 신문이 발행됩니다.</p>
        </div>
      )}

      {status === "done" && (
        <div className="border-4 border-ink p-10 bg-ink text-newsprint-50">
          <div className="text-4xl mb-4">✦</div>
          <p className="font-headline text-2xl font-black mb-3">결제 완료!</p>
          <p className="text-sm text-newsprint-300 mb-6">
            내일 오전 8시, 첫 번째 꿈신문이 발행됩니다.<br />
            이메일로도 알려드립니다.
          </p>
          <p className="text-xs text-newsprint-400">3초 후 대시보드로 이동합니다...</p>
        </div>
      )}

      {status === "error" && (
        <div className="border-2 border-ink p-10">
          <div className="text-3xl mb-4">⚠</div>
          <p className="font-bold text-lg mb-2">확인이 필요합니다</p>
          <p className="text-sm text-ink-muted mb-6">{errorMsg}</p>
          <Link href="/dashboard" className="inline-block bg-ink text-newsprint-50 px-8 py-3 font-bold uppercase tracking-widest text-sm">
            대시보드로 이동 →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-newsprint-50 flex items-center justify-center p-8">
      <Suspense fallback={
        <div className="text-center">
          <div className="font-headline text-4xl font-black tracking-widest mb-10">꿈신문사</div>
          <div className="animate-pulse text-ink-muted">처리 중...</div>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
