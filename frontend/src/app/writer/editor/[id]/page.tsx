"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ordersApi, writerApi, Order, Newspaper } from "@/lib/api";

export default function WriterEditor() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [newspapers, setNewspapers] = useState<Newspaper[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<Newspaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderRes, paperRes] = await Promise.all([
                    ordersApi.get(id as string),
                    ordersApi.getNewspapers(id as string),
                ]);
                setOrder(orderRes.data);
                setNewspapers(paperRes.data);
                if (paperRes.data.length > 0) {
                    setSelectedPaper(paperRes.data[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSave = async () => {
        if (!selectedPaper) return;
        setSaving(true);
        try {
            await writerApi.updateNewspaperDraft(selectedPaper.id, {
                headline: selectedPaper.headline,
                subhead: selectedPaper.subhead,
                lead_paragraph: selectedPaper.lead_paragraph,
                body_content: selectedPaper.body_content,
            });
            alert("임시 저장되었습니다.");
        } catch (err) {
            alert("저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center italic font-serif">원고실로 이동 중...</div>;
    if (!order) return <div className="p-8 text-center">의뢰를 찾을 수 없습니다.</div>;

    return (
        <div className="h-screen flex flex-col bg-newsprint-50 text-ink">
            {/* 상단 툴바 */}
            <header className="border-b-2 border-ink px-6 py-4 flex justify-between items-center bg-newsprint-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-sm font-bold hover:underline">← 뒤로</button>
                    <div className="h-4 w-[1px] bg-ink/20" />
                    <h1 className="font-headline font-bold uppercase tracking-widest">{order.protagonist_name}의 꿈 편집기</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 border-2 border-ink font-bold hover:bg-newsprint-200 transition-colors uppercase text-sm"
                    >
                        {saving ? "저장 중..." : "임시 저장"}
                    </button>
                    <button className="px-6 py-2 bg-ink text-newsprint-50 font-bold hover:bg-ink-light transition-colors uppercase text-sm">최종 발행</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* 사이드바 - 에피소드 목록 */}
                <aside className="w-64 border-r-2 border-ink bg-newsprint-100 overflow-y-auto">
                    <div className="p-4 border-b border-ink bg-ink text-newsprint-50 uppercase text-xs font-bold tracking-widest">에피소드 목록</div>
                    {newspapers.map((paper) => (
                        <button
                            key={paper.id}
                            onClick={() => setSelectedPaper(paper)}
                            className={`w-full text-left p-4 border-b border-ink/40 transition-colors ${selectedPaper?.id === paper.id ? "bg-newsprint-200 font-bold" : "hover:bg-newsprint-150"
                                }`}
                        >
                            <div className="text-[10px] uppercase font-bold text-ink-muted mb-1">Issue #{paper.episode_number}</div>
                            <div className="text-sm line-clamp-1">{paper.headline || "(제목 없음)"}</div>
                            <div className="text-[10px] text-ink-muted mt-1">{paper.future_date}</div>
                        </button>
                    ))}
                </aside>

                {/* 메인 편집 영역 */}
                <main className="flex-1 flex overflow-hidden">
                    {selectedPaper ? (
                        <div className="flex-1 flex gap-0">
                            {/* 왼쪽: 꿈 정보 & AI 가이드 */}
                            <div className="w-1/3 border-r-2 border-ink p-8 overflow-y-auto bg-newsprint-100/50">
                                <section className="mb-12">
                                    <h2 className="text-xs font-bold uppercase tracking-widest border-b border-ink pb-2 mb-4">꿈 의뢰 내용</h2>
                                    <blockquote className="font-serif italic text-lg leading-relaxed text-ink-muted">
                                        &ldquo;{order.dream_description}&rdquo;
                                    </blockquote>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-bold uppercase bg-newsprint-200 p-3">
                                        <div>역할: {order.target_role}</div>
                                        <div>회사: {order.target_company || "미정"}</div>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xs font-bold uppercase tracking-widest border-b border-ink pb-2 mb-4 text-accent">AI 지원 분석</h2>
                                    <p className="text-sm leading-relaxed mb-4">
                                        이전 에피소드와의 연결성을 고려하여 작성하세요. 사용자의 성공 열망이 최고조에 달하는 시점입니다.
                                    </p>
                                    <div className="p-4 bg-ink/5 border border-ink/10 rounded-sm mb-4">
                                        <p className="text-xs font-bold mb-2 uppercase">추천 키워드</p>
                                        <div className="flex flex-wrap gap-2">
                                            {["혁신", "리더십", "글로벌", "성취"].map(kw => (
                                                <span key={kw} className="px-2 py-1 bg-newsprint-300 text-[10px] font-bold">#{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-200">
                                        <p className="text-xs font-bold mb-2 uppercase text-blue-900">AI 자동 스폰서 매칭</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] bg-white p-2 border border-blue-100 italic">
                                                <span>[Slot: Brand Name]</span>
                                                <span className="font-bold text-blue-700">Samsung Global</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] bg-white p-2 border border-blue-100 italic">
                                                <span>[Slot: Sidebar]</span>
                                                <span className="font-bold text-blue-700">Matched: Modern Tech</span>
                                            </div>
                                        </div>
                                        <p className="text-[9px] mt-2 text-blue-600 tracking-tight">* 에이전트가 문맥에 가장 적합한 스폰서를 자동 배치했습니다.</p>
                                    </div>
                                </section>
                            </div>

                            {/* 오른쪽: 편집 폼 */}
                            <div className="flex-1 p-12 overflow-y-auto bg-newsprint-50">
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted block mb-2">Main Headline</label>
                                        <textarea
                                            value={selectedPaper.headline || ""}
                                            onChange={(e) => setSelectedPaper({ ...selectedPaper, headline: e.target.value })}
                                            className="w-full text-4xl font-headline font-bold border-none bg-transparent focus:ring-0 focus:outline-none resize-none p-0 overflow-hidden"
                                            rows={2}
                                            placeholder="헤드라인을 작성하세요"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted block mb-2">Subhead / Deck</label>
                                        <textarea
                                            value={selectedPaper.subhead || ""}
                                            onChange={(e) => setSelectedPaper({ ...selectedPaper, subhead: e.target.value })}
                                            className="w-full text-xl italic font-serif border-none bg-transparent focus:ring-0 focus:outline-none resize-none p-0"
                                            rows={2}
                                            placeholder="부제목을 작성하세요"
                                        />
                                    </div>

                                    <hr className="border-ink/20" />

                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted block mb-2">Lead Paragraph</label>
                                        <textarea
                                            value={selectedPaper.lead_paragraph || ""}
                                            onChange={(e) => setSelectedPaper({ ...selectedPaper, lead_paragraph: e.target.value })}
                                            className="w-full text-lg leading-relaxed font-serif border-none bg-transparent focus:ring-0 focus:outline-none resize-none p-0"
                                            rows={4}
                                            placeholder="리드 문단을 작성하세요"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted block mb-2">Body Story</label>
                                        <textarea
                                            value={selectedPaper.body_content || ""}
                                            onChange={(e) => setSelectedPaper({ ...selectedPaper, body_content: e.target.value })}
                                            className="w-full text-md leading-loose font-serif border-none bg-transparent focus:ring-0 focus:outline-none resize-none p-0"
                                            rows={15}
                                            placeholder="본문 내용을 작성하세요"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center italic text-ink-muted">에피소드를 선택해주세요.</div>
                    )}
                </main>
            </div>
        </div>
    );
}
