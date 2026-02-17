"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ordersApi, Order } from "@/lib/api";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .list()
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusLabel: Record<string, string> = {
    draft: "준비 중",
    active: "연재 중",
    paused: "일시 중지",
    completed: "완료",
    cancelled: "취소됨",
  };

  const statusColor: Record<string, string> = {
    draft: "bg-newsprint-300",
    active: "bg-green-600 text-white",
    paused: "bg-yellow-500",
    completed: "bg-ink text-newsprint-50",
    cancelled: "bg-red-500 text-white",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-headline text-2xl text-ink-muted">꿈신문 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="newspaper-masthead px-0 mb-8">
        <div className="newspaper-date-line mb-2">
          <span>나의 꿈신문</span>
          <span className="font-headline font-bold text-2xl">꿈신문사</span>
          <span>대시보드</span>
        </div>
        <h1 className="font-headline text-4xl font-bold">내 꿈 시리즈</h1>
      </div>

      {/* 새 의뢰 버튼 */}
      <div className="mb-8">
        <Link
          href="/order/new"
          className="inline-block bg-ink text-newsprint-50 px-6 py-3 font-bold uppercase tracking-widest hover:bg-ink-light transition-colors"
        >
          + 새 꿈 의뢰하기
        </Link>
      </div>

      {/* 의뢰 목록 */}
      {orders.length === 0 ? (
        <div className="border-2 border-ink p-12 text-center bg-newsprint-100">
          <div className="font-headline text-3xl font-bold mb-4">
            아직 꿈 의뢰가 없습니다
          </div>
          <p className="text-ink-muted mb-6">
            첫 번째 꿈을 의뢰하면 내일 아침부터 꿈신문이 시작됩니다.
          </p>
          <Link
            href="/order/new"
            className="bg-ink text-newsprint-50 px-8 py-3 font-bold hover:bg-ink-light transition-colors"
          >
            꿈 의뢰하기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border-2 border-ink bg-newsprint-100 p-6"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="font-headline text-xl font-bold">
                    {order.protagonist_name}의 꿈
                  </h2>
                  <p className="text-sm text-ink-muted mt-1">
                    {order.target_role}
                    {order.target_company && ` @ ${order.target_company}`}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 ${statusColor[order.status] || "bg-newsprint-300"}`}
                >
                  {statusLabel[order.status] || order.status}
                </span>
              </div>

              <p className="text-sm text-ink-muted mb-4 line-clamp-2">
                {order.dream_description}
              </p>

              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>{order.duration_days}</strong>일 시리즈
                  </span>
                  <span>
                    발행:{" "}
                    <strong>
                      {order.published_newspapers}/{order.duration_days}
                    </strong>
                    편
                  </span>
                  <span>{order.future_year}년 배경</span>
                </div>

                <Link
                  href={`/newspapers/${order.id}`}
                  className="text-sm border border-ink px-4 py-1 font-medium hover:bg-newsprint-200 transition-colors"
                >
                  신문 보기 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
