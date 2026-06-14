"""신문 생성 파이프라인 통합 테스트 스크립트"""
import asyncio
import sys
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
sys.path.insert(0, '/app')

ORDER_ID = 'e20032dc-0d83-45f0-8083-80b855c224b1'


async def main():
    from app.database import get_db_session
    from app.agents.editor_in_chief.agent import EditorInChief
    from app.models.newspaper import Newspaper
    from sqlalchemy import text

    print("=" * 60)
    print("꿈신문사 신문 생성 파이프라인 테스트")
    print("=" * 60)

    async with get_db_session() as db:
        # 주문 로드
        result = await db.execute(
            text("SELECT * FROM orders WHERE id=:id"),
            {"id": ORDER_ID}
        )
        order = result.fetchone()
        if not order:
            print("❌ Order not found")
            return

        print(f"\n[주문 정보]")
        print(f"  주인공: {order.protagonist_name}")
        print(f"  역할: {order.target_role}")
        print(f"  꿈: {order.dream_description}")
        print(f"  기간: {order.duration_days}일")
        print(f"  상태: {order.status} / 결제: {order.payment_status}")

        order_dict = {
            "id": str(order.id),
            "protagonist_name": order.protagonist_name,
            "dream_description": order.dream_description,
            "target_role": order.target_role,
            "target_company": order.target_company or "",
            "duration_days": order.duration_days,
            "future_year": order.future_year,
            "timezone": order.timezone,
            "publish_time": str(order.publish_time),
            "writer_type": order.writer_type,
        }

        print(f"\n[EditorInChief 초기화 중...]")
        orchestrator = EditorInChief()

        # 스폰서 매칭 테스트
        print(f"\n[스폰서 매칭 테스트]")
        sponsor_company = order.target_company or ""
        try:
            matched = await orchestrator.ad_sales.find_sponsors(order_dict)
            if matched:
                sponsor_company = matched[0].get("company_name", "")
                print(f"  ✅ 스폰서 매칭: {sponsor_company} (총 {len(matched)}개)")
            else:
                print(f"  ⚠️ 매칭된 스폰서 없음 (vector_items 비어있을 수 있음)")
        except Exception as e:
            print(f"  ⚠️ 스폰서 매칭 실패: {e}")

        # 신문 생성
        print(f"\n[신문 생성 시작] ⏱️ 타이머 시작...")
        start_ts = time.time()
        scheduled_date = datetime.now(ZoneInfo("Asia/Seoul"))

        try:
            newspaper_content = await orchestrator.generate_with_editorial_loop(
                order=order_dict,
                episode=1,
                scheduled_date=scheduled_date,
                sponsor_company=sponsor_company or order.target_company or "글로벌 AI 기업",
                previous_summary=None,
            )
            elapsed = time.time() - start_ts
            print(f"  ✅ 생성 완료! ({elapsed:.1f}초)")
            print(f"\n[생성된 신문 내용]")
            print(f"  헤드라인: {newspaper_content.get('headline', 'N/A')}")
            print(f"  서브헤드: {newspaper_content.get('subhead', 'N/A')}")
            lead = newspaper_content.get('lead_paragraph', '') or ''
            print(f"  리드: {lead[:150]}..." if len(lead) > 150 else f"  리드: {lead}")
            print(f"  AI 모델: {newspaper_content.get('ai_model', 'N/A')}")
            print(f"  생성 시간: {newspaper_content.get('generation_ms', 'N/A')}ms")

            # DB에 저장
            print(f"\n[DB 저장 중...]")
            newspaper = Newspaper(
                order_id=order.id,
                episode_number=1,
                future_date=newspaper_content["future_date"],
                future_date_label=newspaper_content.get("future_date_label", ""),
                headline=newspaper_content.get("headline"),
                subhead=newspaper_content.get("subhead"),
                lead_paragraph=newspaper_content.get("lead_paragraph"),
                body_content=newspaper_content.get("body_content"),
                sidebar_content={
                    **newspaper_content.get("sidebar", {}),
                    "episode_summary": newspaper_content.get("episode_summary", ""),
                },
                raw_content=newspaper_content.get("raw_content"),
                variables_used={
                    "protagonist": order.protagonist_name,
                    "sponsor": sponsor_company,
                },
                ai_model=newspaper_content.get("ai_model"),
                generation_ms=newspaper_content.get("generation_ms"),
                status="published",
                published_at=datetime.now(timezone.utc),
                scheduled_at=datetime.now(timezone.utc),
            )
            db.add(newspaper)
            await db.commit()
            print(f"  ✅ DB 저장 완료! newspaper.id = {newspaper.id}")
            print(f"\n🎉 신문 생성 파이프라인 테스트 성공!")
            print(f"   브라우저에서 확인: http://localhost:3000/newspapers/{ORDER_ID}")

        except Exception as e:
            elapsed = time.time() - start_ts
            print(f"  ❌ 신문 생성 실패 ({elapsed:.1f}초): {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
