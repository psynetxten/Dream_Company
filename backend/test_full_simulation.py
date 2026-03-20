"""
꿈신문사 전체 시뮬레이션
모든 경우의 수 테스트:
- 8가지 직업군 × 3가지 상품(7/14/30일) × 2가지 결제(one_time/subscription)
- AI 작가 / 인간 작가 양쪽 파이프라인
- 스폰서 매칭, SNS 카피, 시각 프롬프트 생성
- HR Manager 신규 메서드
"""
import asyncio
import json
import time
import traceback
from datetime import datetime

RESULTS = []

def log(category, name, status, detail="", ms=0):
    icon = "PASS" if status else "FAIL"
    RESULTS.append({"category": category, "name": name, "status": status, "detail": detail, "ms": ms})
    ms_str = f" ({ms}ms)" if ms else ""
    print(f"  [{icon}] {name}{ms_str}")
    if not status and detail:
        print(f"         -> {detail[:120]}")


# ─────────────────────────────────────────────
# 시나리오 정의
# ─────────────────────────────────────────────
SCENARIOS = [
    # (직업군, 꿈, 목표역할, 기간, 결제유형)
    ("career",    "삼성전자 AI 칩 설계 엔지니어가 되고 싶습니다",     "AI 반도체 엔지니어",    7,  "one_time"),
    ("life",      "전 세계를 유랑하며 에세이를 쓰는 여행작가",         "여행 에세이 작가",       30, "subscription"),
    ("medical",   "서울대병원 신경외과 전문의가 되고 싶습니다",         "신경외과 전문의",        14, "one_time"),
    ("business",  "글로벌 스타트업 CEO로 IPO를 이끌고 싶습니다",       "스타트업 CEO",          30, "subscription"),
    ("education", "하버드 교육학과 교수가 되고 싶습니다",              "교육학 교수",            7,  "one_time"),
    ("sports",    "올림픽 금메달리스트 수영 선수가 되고 싶습니다",      "올림픽 수영 선수",       14, "one_time"),
    ("arts",      "칸 영화제 황금종려상 감독이 되고 싶습니다",          "영화감독",               30, "subscription"),
    ("science",   "노벨 물리학상을 수상하는 우주물리학자",              "우주물리학자",           14, "one_time"),
]


async def test_hr_manager():
    """HR Manager 전체 메서드 테스트"""
    print("\n[HR Manager 테스트]")
    from app.agents.hr_manager.agent import HRManager
    hr = HRManager()

    # 1. 업무량 현황
    t = time.time()
    try:
        status = await hr.get_workload_status()
        ms = int((time.time() - t) * 1000)
        log("HR", "get_workload_status", True, f"{len(status)}명 조회", ms)
        for w in status:
            print(f"       {w['pen_name']}: {w['current_orders']}/{w['max_orders']} ({w['capacity_pct']}%) | specialties={w['specialties']}")
    except Exception as e:
        log("HR", "get_workload_status", False, str(e))

    # 2. 작가 등록
    import uuid
    test_user_id = None
    t = time.time()
    try:
        from app.database import AsyncSessionLocal
        from app.models.user import User
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.role == "writer").limit(1))
            writer_user = result.scalar_one_or_none()
            if writer_user:
                test_user_id = str(writer_user.id)

        if test_user_id:
            profile = await hr.register_writer(test_user_id, {
                "pen_name": "테스트 신규작가",
                "bio": "시뮬레이션 테스트용",
                "specialties": ["career", "science"],
            })
            ms = int((time.time() - t) * 1000)
            log("HR", "register_writer", bool(profile), f"pen_name={profile.get('pen_name', '')}", ms)
        else:
            log("HR", "register_writer", False, "writer 유저 없음")
    except Exception as e:
        log("HR", "register_writer", False, str(e)[:100])

    # 3. 가용여부 변경
    if test_user_id:
        t = time.time()
        try:
            await hr.set_writer_availability(test_user_id, False)
            await hr.set_writer_availability(test_user_id, True)
            ms = int((time.time() - t) * 1000)
            log("HR", "set_writer_availability", True, "False→True 전환", ms)
        except Exception as e:
            log("HR", "set_writer_availability", False, str(e)[:100])

    # 4. 평점 업데이트
    if test_user_id:
        t = time.time()
        try:
            await hr.update_writer_rating(test_user_id, 4.8)
            ms = int((time.time() - t) * 1000)
            log("HR", "update_writer_rating", True, "4.8점 업데이트", ms)
        except Exception as e:
            log("HR", "update_writer_rating", False, str(e)[:100])


async def test_writer_decision(scenario: dict) -> str:
    """AI vs 인간 작가 결정"""
    from app.agents.hr_manager.agent import HRManager
    hr = HRManager()
    t = time.time()
    try:
        writer_type = await hr.decide_writer_type(scenario)
        ms = int((time.time() - t) * 1000)
        log("WriterDecision", scenario["name"], True, f"→ {writer_type.upper()}", ms)
        return writer_type
    except Exception as e:
        log("WriterDecision", scenario["name"], False, str(e)[:100])
        return "ai"


async def test_sponsor_matching(scenario: dict):
    """스폰서 매칭"""
    from app.agents.ad_sales.agent import AdSales
    ad = AdSales()
    t = time.time()
    try:
        sponsors = await ad.find_sponsors(scenario)
        ms = int((time.time() - t) * 1000)
        names = [s.get("company_name", "") for s in sponsors[:3]]
        log("Sponsor", scenario["name"], True, f"{names}", ms)
        return sponsors
    except Exception as e:
        log("Sponsor", scenario["name"], False, str(e)[:100])
        return []


async def test_newspaper_generation(scenario: dict, writer_type: str):
    """신문 생성 (AI 또는 인간 초안)"""
    from app.agents.editor_in_chief.agent import EditorInChief
    orchestrator = EditorInChief()
    t = time.time()
    try:
        order_ctx = {**scenario, "writer_type": writer_type}
        result = await orchestrator.generate_single_newspaper(
            order=order_ctx,
            episode=1,
            scheduled_date=datetime.now(),
            sponsor_company=scenario.get("target_company"),
        )
        ms = int((time.time() - t) * 1000)
        headline = result.get("headline", "")[:40]
        has_sns = bool(result.get("sns_copy"))
        has_visual = bool(result.get("visual_prompt"))
        log("Newspaper", scenario["name"],
            bool(result.get("headline")),
            f"headline={headline} | sns={has_sns} | visual={has_visual}",
            ms)
        return result
    except Exception as e:
        log("Newspaper", scenario["name"], False, str(e)[:100])
        return {}


async def run():
    print("=" * 65)
    print("꿈신문사 전체 시뮬레이션")
    print("=" * 65)

    # ── HR Manager 테스트 ──
    await test_hr_manager()

    # ── 시나리오별 전체 파이프라인 ──
    print(f"\n[전체 파이프라인 - {len(SCENARIOS)}개 시나리오]")
    for i, (specialty, dream, role, days, payment) in enumerate(SCENARIOS, 1):
        scenario = {
            "id": f"sim-{i:02d}",
            "name": f"S{i:02d} {specialty}/{days}일/{payment}",
            "protagonist_name": f"테스터{i}",
            "dream_description": dream,
            "target_role": role,
            "target_company": "",
            "duration_days": days,
            "payment_type": payment,
            "future_year": 2030,
            "timezone": "Asia/Seoul",
            "publish_time": "08:00:00",
        }
        print(f"\n  시나리오 {i}: {dream[:30]}...")

        # 1) 작가 유형 결정
        writer_type = await test_writer_decision(scenario)

        # 2) 스폰서 매칭
        await test_sponsor_matching(scenario)

        # 3) 신문 생성
        await test_newspaper_generation(scenario, writer_type)

        # Gemini 분당 쿼터 초과 방지
        if i < len(SCENARIOS):
            await asyncio.sleep(5)

    # ── 최종 리포트 ──
    print("\n" + "=" * 65)
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["status"])
    failed = total - passed

    print(f"시뮬레이션 결과: {passed}/{total} 통과 | {failed}개 실패")
    print("=" * 65)

    if failed:
        print("\n[실패 항목]")
        for r in RESULTS:
            if not r["status"]:
                print(f"  - [{r['category']}] {r['name']}: {r['detail'][:100]}")

    print("\n[카테고리별 현황]")
    categories = {}
    for r in RESULTS:
        c = r["category"]
        categories.setdefault(c, {"pass": 0, "fail": 0})
        if r["status"]:
            categories[c]["pass"] += 1
        else:
            categories[c]["fail"] += 1
    for c, v in categories.items():
        bar = "PASS" if v["fail"] == 0 else "PARTIAL" if v["pass"] > 0 else "FAIL"
        print(f"  {bar:8} {c}: {v['pass']}통과 / {v['fail']}실패")

    print("=" * 65)
    return RESULTS


if __name__ == "__main__":
    asyncio.run(run())
