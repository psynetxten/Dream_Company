"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { writerApi, Order } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function WriterDashboard() {
    const router = useRouter();
    const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace("/login");
    };

    const fetchData = async () => {
        try {
            const [assignedRes, availableRes] = await Promise.all([
                writerApi.getAssignedOrders(),
                writerApi.getAvailableOrders(),
            ]);
            setAssignedOrders(assignedRes.data);
            setAvailableOrders(availableRes.data);
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 401) {
                router.replace("/login");
                return;
            } else if (status === 403) {
                setError("작가 계정으로 로그인해야 합니다. 일반 계정은 접근이 제한됩니다.");
            } else {
                setError("데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleClaim = async (orderId: string) => {
        try {
            await writerApi.claimOrder(orderId);
            alert("의뢰가 배정되었습니다!");
            fetchData();
        } catch (err) {
            alert("의뢰 배정에 실패했습니다.");
        }
    };

    if (loading) return <div className="p-8 text-center font-serif italic text-ink-muted">작가의 집무실로 이동 중...</div>;

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <header className="border-b-4 border-ink pb-4 mb-12 flex justify-between items-end">
                <div>
                    <h1 className="font-headline text-4xl font-bold uppercase tracking-widest">작가 집무실</h1>
                    <p className="text-sm text-ink-muted mt-2 italic">전문 작가 전용 대시보드</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm border-2 border-ink px-4 py-2 font-bold uppercase tracking-widest hover:bg-ink hover:text-newsprint-50 transition-colors"
                >
                    로그아웃
                </button>
            </header>

            {error && (
                <div className="border-2 border-red-500 bg-red-50 p-4 text-red-700 mb-8 font-serif">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* 배정된 의뢰Section */}
                <section>
                    <h2 className="font-headline text-2xl font-bold mb-6 border-b-2 border-ink pb-2">진행 중인 의뢰</h2>
                    <div className="space-y-4">
                        {assignedOrders.length === 0 ? (
                            <p className="text-ink-muted italic font-serif py-12 text-center bg-newsprint-100 border-2 border-dashed border-ink-muted">배정된 의뢰가 없습니다.</p>
                        ) : (
                            assignedOrders.map((order) => (
                                <div key={order.id} className="newspaper-page p-6 border-2 border-ink bg-newsprint-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-headline text-xl font-bold">{order.protagonist_name}의 꿈</h3>
                                            <p className="text-xs text-ink-muted uppercase tracking-widest mt-1">{order.target_role} @ {order.target_company || "미정"}</p>
                                        </div>
                                        <span className="text-xs bg-ink text-newsprint-50 px-2 py-1 uppercase">{order.duration_days}일 시리즈</span>
                                    </div>
                                    <p className="text-sm text-ink-muted mb-6 line-clamp-3 font-serif italic">&ldquo;{order.dream_description}&rdquo;</p>
                                    <Link
                                        href={`/writer/editor/${order.id}`}
                                        className="block w-full text-center bg-ink text-newsprint-50 py-2 font-bold hover:bg-ink-light transition-colors uppercase tracking-widest"
                                    >
                                        편집기 열기
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* 배정 대기 의뢰 Section */}
                <section>
                    <h2 className="font-headline text-2xl font-bold mb-6 border-b-2 border-ink pb-2">작가를 기다리는 꿈</h2>
                    <div className="space-y-4">
                        {availableOrders.length === 0 ? (
                            <p className="text-ink-muted italic font-serif py-12 text-center bg-newsprint-100 border-2 border-dashed border-ink-muted">현재 대기 중인 의뢰가 없습니다.</p>
                        ) : (
                            availableOrders.map((order) => (
                                <div key={order.id} className="p-6 border-2 border-ink bg-newsprint-50 border-dotted">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-headline text-lg font-bold">{order.protagonist_name}님</h3>
                                            <p className="text-xs text-ink-muted mt-1 italic">{order.target_role}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold block mb-1">KRW 40,000</span>
                                            <span className="text-[10px] text-ink-muted uppercase">수익금 예정</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-ink-muted mb-6 line-clamp-2 font-serif">&ldquo;{order.dream_description}&rdquo;</p>
                                    <button
                                        onClick={() => handleClaim(order.id)}
                                        className="w-full border-2 border-ink py-2 font-bold hover:bg-newsprint-200 transition-colors uppercase tracking-widest text-sm"
                                    >
                                        집필 의뢰 수락
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
