"""
WriterManager 시뮬레이션 테스트
- 업무량 현황 조회
- AI vs 인간 작가 결정 (3가지 시나리오)
- 인간 작가 배정 + current_order_count 증가
- AI 초안 생성 (인간 작가용)
- 작가 슬롯 반납
"""
import asyncio
import json
from app.agents.hr_manager.agent import HRManager


async def run():
    wm = HRManager()

    print("=" * 60)
    print("WriterManager 시뮬레이션")
    print("=" * 60)

    # 1. 작가 업무량 현황
    print("\n[1] 현재 작가 업무량 현황")
    status = await wm.get_workload_status()
    for w in status:
        print(f"  - {w['pen_name']} ({w['email']})")
        print(f"    전문분야: {w['specialties']}")
        print(f"    업무: {w['current_orders']}/{w['max_orders']} ({w['capacity_pct']}%)")
        print(f"    AI보조: {w['ai_assist_level']} | 평점: {w['avg_rating']}")

    # 2. 작가 유형 결정 시나리오
    scenarios = [
        {
            "name": "시나리오A - 단기 AI 의뢰 (7일, one_time, 개발자)",
            "order": {
                "id": "scenario-a",
                "dream_description": "삼성전자 소프트웨어 엔지니어로 입사해 AI 칩을 설계하고 싶습니다",
                "target_role": "AI 반도체 엔지니어",
                "duration_days": 7,
                "payment_type": "one_time",
            }
        },
        {
            "name": "시나리오B - 장기 감성 의뢰 (30일, subscription, 여행작가)",
            "order": {
                "id": "scenario-b",
                "dream_description": "전 세계를 유랑하며 사람들의 이야기를 담은 에세이를 쓰는 여행 작가가 되고 싶습니다",
                "target_role": "여행 에세이 작가",
                "duration_days": 30,
                "payment_type": "subscription",
            }
        },
        {
            "name": "시나리오C - 노마드 개발자 (14일, one_time)",
            "order": {
                "id": "scenario-c",
                "dream_description": "전 세계를 여행하며 IT 기술을 전파하는 디지털 노마드가 되고 싶습니다",
                "target_role": "디지털 노마드 개발자",
                "target_company": "Google Open Source Team",
                "duration_days": 14,
                "payment_type": "one_time",
            }
        },
    ]

    assigned_writer_id = None

    for sc in scenarios:
        print(f"\n[2] {sc['name']}")
        writer_type = await wm.decide_writer_type(sc["order"])
        print(f"  -> 결정: {writer_type.upper()}")

        if writer_type == "human":
            print("  -> 인간 작가 배정 시도...")
            match = await wm.find_best_writer(sc["order"])
            if match:
                print(f"     배정됨: {match['pen_name']} (score={match['score']})")
                print(f"     AI 보조 레벨: {match['ai_assist_level']}")
                assigned_writer_id = match["writer_id"]

                print("\n  -> AI 편집 초안 생성...")
                draft = await wm.generate_ai_draft(sc["order"], episode=1)
                print(f"     헤드라인: {draft.get('headline', '')[:50]}")
                print(f"     AI노트: {draft.get('ai_assist_note', '')}")
            else:
                print("     가용 작가 없음 -> AI 폴백")

    # 3. 배정 후 업무량 확인
    print("\n[3] 배정 후 작가 업무량 현황")
    status2 = await wm.get_workload_status()
    for w in status2:
        print(f"  - {w['pen_name']}: {w['current_orders']}/{w['max_orders']} ({w['capacity_pct']}%)")

    # 4. 슬롯 반납
    if assigned_writer_id:
        print(f"\n[4] 작가 슬롯 반납 ({assigned_writer_id[:8]}...)")
        await wm.release_writer(assigned_writer_id)
        status3 = await wm.get_workload_status()
        for w in status3:
            print(f"  - {w['pen_name']}: {w['current_orders']}/{w['max_orders']} (반납 후)")

    print("\n" + "=" * 60)
    print("WriterManager 시뮬레이션 완료")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run())
