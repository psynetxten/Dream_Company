"""테스트용 신문 DB 직접 삽입 (raw SQL)"""
import asyncio
import sys
import json
import uuid
from datetime import datetime, timezone
sys.path.insert(0, '/app')

ORDER_ID = 'e20032dc-0d83-45f0-8083-80b855c224b1'

EPISODES = [
    {
        "episode_number": 1,
        "future_date": "2030-03-14",
        "future_date_label": "2030년 3월 14일",
        "headline": "김테스트 대표, 글로벌 AI 스타트업 '드림AI' 시리즈B 500억 투자 유치 성공",
        "subhead": "3년 만에 17개국 진출, 월 활성 사용자 200만 돌파 — '기술이 꿈을 현실로 만든다'",
        "lead_paragraph": "글로벌 AI 기업 드림AI의 김테스트 대표가 세계 최대 벤처캐피털 Sequoia Capital로부터 500억 원 규모의 시리즈B 투자를 유치했다. 이번 투자는 한국 AI 스타트업 역사상 세 번째로 큰 규모로, 드림AI의 혁신적인 언어 모델 기술력과 빠른 글로벌 확장 능력을 인정받은 결과다.",
        "body_content": json.dumps({
            "main": "드림AI는 지난 3년간 김테스트 대표의 리더십 아래 급성장했다. 창업 초기 3명으로 시작한 팀은 현재 전 세계 17개국에 280명의 인재를 두고 있으며, 월 활성 사용자 200만 명을 보유한 B2B SaaS 플랫폼으로 자리매김했다.\n\n특히 드림AI의 핵심 제품인 'DreamTranslate'는 실시간 다국어 번역 정확도에서 기존 솔루션 대비 43% 향상된 성능을 보이며, 삼성전자, 현대자동차, LG전자 등 국내 대기업 50개사가 도입했다.",
            "quote": "'세계 무대에서 한국 AI 기업의 가능성을 증명하는 것이 저의 사명입니다.' — 김테스트 드림AI 대표"
        }, ensure_ascii=False),
        "sidebar_content": json.dumps({
            "key_facts": ["투자 유치액: 시리즈B 500억 원", "진출 국가: 17개국", "월 활성 사용자: 200만 명", "직원 수: 280명"],
            "sponsor_mention": "이번 투자에는 스폰서 파트너 미래드림 IT가 전략적 투자자로 참여했다.",
            "episode_summary": "김테스트가 설립한 드림AI가 시리즈B 500억 투자를 유치하며 글로벌 AI 기업으로 도약했다."
        }, ensure_ascii=False),
    },
    {
        "episode_number": 2,
        "future_date": "2030-03-15",
        "future_date_label": "2030년 3월 15일",
        "headline": "드림AI 김테스트, 세계경제포럼(WEF) 다보스 연단에 서다",
        "subhead": "AI 시대의 인간 중심 혁신을 주제로 전 세계 리더들과 대화",
        "lead_paragraph": "드림AI의 김테스트 대표가 세계경제포럼(WEF) 다보스 포럼의 메인 무대에 초청받아 'AI 시대의 인간 중심 혁신'을 주제로 기조연설을 진행했다. 1년 전까지만 해도 스타트업 창업가였던 김테스트가 세계 최고의 무대에 선 것이다.",
        "body_content": json.dumps({
            "main": "다보스 포럼 메인 홀에 모인 3,000여 명의 글로벌 리더들은 김테스트 대표의 연설에 집중했다. '기술은 도구입니다. 중요한 것은 그 도구를 어떻게 사람을 위해 사용하느냐입니다.' 김테스트의 이 한 마디는 포럼 전체를 관통하는 메시지가 됐다.\n\n연설 이후 마이크로소프트 CEO와 비공개 미팅을 가진 김테스트는 글로벌 파트너십 가능성을 논의한 것으로 알려졌다.",
            "quote": "'기술은 사람을 위해 존재합니다. 저는 그 믿음 하나로 여기까지 왔습니다.' — 김테스트"
        }, ensure_ascii=False),
        "sidebar_content": json.dumps({
            "key_facts": ["포럼 참가자: 전 세계 3,000명", "연설 주제: AI 시대 인간 중심 혁신", "비공개 미팅: MS CEO 포함 5개사"],
            "episode_summary": "김테스트가 다보스 포럼 메인 무대에서 AI 혁신 방향을 제시하며 글로벌 리더로 인정받았다."
        }, ensure_ascii=False),
    },
    {
        "episode_number": 3,
        "future_date": "2030-03-16",
        "future_date_label": "2030년 3월 16일",
        "headline": "김테스트의 드림AI, 유네스코 '글로벌 AI 혁신상' 수상",
        "subhead": "교육 불평등 해소 기여로 전 세계 97개국 AI 기업 중 최고상 수상",
        "lead_paragraph": "드림AI가 유네스코로부터 '2030 글로벌 AI 혁신상'을 수상했다. 드림AI의 무료 교육 AI 플랫폼이 아프리카와 동남아시아 등 교육 소외 지역 120만 명의 학생에게 양질의 교육을 제공한 공로가 인정됐다. 김테스트 대표는 상금 전액을 교육 소외 지역 AI 인프라 구축에 기부했다.",
        "body_content": json.dumps({
            "main": "파리 유네스코 본부에서 열린 시상식에서 김테스트 대표는 수상 소감을 통해 '수익을 창출하면서도 사회에 기여하는 것이 AI 기업의 책임'이라고 강조했다. 드림AI의 무료 교육 플랫폼 'DreamLearn'은 현재 97개국 120만 명의 학생들이 사용 중이며, 해당 지역 학업 성취도를 평균 37% 향상시킨 것으로 측정됐다.\n\n미래드림 IT와의 전략적 파트너십을 통해 드림AI는 지속 가능한 AI 교육 생태계를 구축하고 있다.",
            "quote": "'돈을 버는 것과 세상을 바꾸는 것은 함께 갈 수 있습니다.' — 김테스트"
        }, ensure_ascii=False),
        "sidebar_content": json.dumps({
            "key_facts": ["수상: 유네스코 글로벌 AI 혁신상", "수혜 학생 수: 120만 명", "진출 국가: 97개국", "학업 성취도 향상: 평균 37%"],
            "episode_summary": "드림AI가 교육 AI로 유네스코상을 받으며 사회적 책임을 다하는 글로벌 기업으로 자리매김했다."
        }, ensure_ascii=False),
    }
]


async def main():
    from app.database import get_db_session
    from sqlalchemy import text

    now = datetime.now(timezone.utc).isoformat()

    async with get_db_session() as db:
        # 기존 신문 삭제
        await db.execute(
            text("DELETE FROM newspapers WHERE order_id=:id"),
            {"id": ORDER_ID}
        )
        print("기존 신문 삭제 완료")

        for ep in EPISODES:
            nid = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO newspapers (
                    id, order_id, episode_number,
                    future_date, future_date_label,
                    headline, subhead, lead_paragraph,
                    body_content, sidebar_content,
                    variables_used, ai_model, generation_ms,
                    status, published_at, scheduled_at,
                    created_at, updated_at
                ) VALUES (
                    :id, :order_id, :episode_number,
                    :future_date::date, :future_date_label,
                    :headline, :subhead, :lead_paragraph,
                    :body_content::jsonb, :sidebar_content::jsonb,
                    :variables_used::jsonb, :ai_model, :generation_ms,
                    'published', :now::timestamptz, :now::timestamptz,
                    :now::timestamptz, :now::timestamptz
                )
            """), {
                "id": nid,
                "order_id": ORDER_ID,
                "episode_number": ep["episode_number"],
                "future_date": ep["future_date"],
                "future_date_label": ep["future_date_label"],
                "headline": ep["headline"],
                "subhead": ep["subhead"],
                "lead_paragraph": ep["lead_paragraph"],
                "body_content": ep["body_content"],
                "sidebar_content": ep["sidebar_content"],
                "variables_used": json.dumps({"protagonist": "김테스트", "sponsor": "미래드림 IT"}, ensure_ascii=False),
                "ai_model": "test-seed",
                "generation_ms": 0,
                "now": now,
            })
            print(f"  ✅ EP{ep['episode_number']} 삽입: {ep['headline'][:40]}...")

        await db.commit()
        print(f"\n✅ 총 {len(EPISODES)}편 삽입 완료!")
        print(f"   http://localhost:3000/newspapers/{ORDER_ID}")


if __name__ == "__main__":
    asyncio.run(main())
