import asyncio, uuid
from datetime import datetime, timezone, date
from sqlalchemy import select
from app.database import get_db_session
from app.models.user import User
from app.models.writer import WriterProfile
from app.models.sponsor import Sponsor, SponsorSlot
from app.models.order import Order
from app.models.newspaper import Newspaper

USER_ID    = uuid.UUID('a2ce7ac7-8e8e-4029-8444-73f88ab153ae')
WRITER_ID  = uuid.UUID('40d22307-f26f-4a2b-aea2-1fc9ae716c92')
SPONSOR_ID = uuid.UUID('2ec9db2d-ac57-4294-be55-e47e9463dcaa')

async def main():
    async with get_db_session() as db:

        # ── 1. Users ──────────────────────────────────────────────────────
        for uid, email, name, role in [
            (USER_ID,    'test_user@dream.com',    '김꿈돌', 'user'),
            (WRITER_ID,  'test_writer@dream.com',  '박기자', 'writer'),
            (SPONSOR_ID, 'test_sponsor@dream.com', '이광고', 'sponsor'),
        ]:
            row = (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()
            if not row:
                db.add(User(id=uid, email=email, full_name=name, role=role,
                            is_active=True, is_verified=True))
                print(f"  [생성] {role:7s} {email}")
            else:
                row.role = role
                print(f"  [업데이트] {role:7s} {email}")
        await db.commit()

        # ── 2. WriterProfile ──────────────────────────────────────────────
        wp = (await db.execute(
            select(WriterProfile).where(WriterProfile.user_id == WRITER_ID)
        )).scalar_one_or_none()
        if not wp:
            db.add(WriterProfile(
                user_id=WRITER_ID,
                pen_name='꿈결 박기자',
                bio='10년 경력의 커리어 전문 기자. 당신의 꿈을 가장 생생한 미래로 그려드립니다.',
                specialties=['career', 'tech', 'startup'],
                is_available=True,
                avg_rating=4.8,
                total_reviews=24,
                current_order_count=2,
                total_earnings_krw=960000,
            ))
            print("  [생성] WriterProfile")
        await db.commit()

        # ── 3. Sponsor + Slots ────────────────────────────────────────────
        sp = (await db.execute(
            select(Sponsor).where(Sponsor.user_id == SPONSOR_ID)
        )).scalar_one_or_none()
        if not sp:
            sp = Sponsor(
                user_id=SPONSOR_ID,
                company_name='드림테크 주식회사',
                industry='tech',
                description='AI 기반 커리어 플랫폼. 꿈을 현실로 만드는 기술.',
                website_url='https://dreamtech.kr',
                contact_email='test_sponsor@dream.com',
                target_roles=['소프트웨어 엔지니어', '데이터 사이언티스트', 'AI 연구원'],
                target_companies=['구글', '네이버', '카카오'],
                target_keywords=['AI', '개발자', '스타트업'],
                is_active=True,
            )
            db.add(sp)
            await db.flush()
            for slot_type, val in [
                ('company_name', '드림테크'),
                ('banner', '드림테크와 함께 AI 커리어를 시작하세요'),
            ]:
                db.add(SponsorSlot(
                    sponsor_id=sp.id,
                    slot_type=slot_type,
                    variable_value=val,
                    purchased_quantity=50,
                    remaining_quantity=47,
                    price_per_unit=10000,
                    total_amount=500000,
                    payment_status='paid',
                ))
            print("  [생성] Sponsor + Slot 2개")
        await db.commit()

        # ── 4. Order + Newspapers (유저용) ───────────────────────────────
        existing_orders = (await db.execute(
            select(Order).where(Order.user_id == USER_ID)
        )).scalars().all()

        if not existing_orders:
            order_id = uuid.uuid4()
            order = Order(
                id=order_id,
                user_id=USER_ID,
                protagonist_name='김꿈돌',
                dream_description='AI 스타트업을 창업해 세계적인 유니콘 기업을 만드는 꿈',
                target_role='AI 스타트업 CEO',
                target_company='드림AI',
                duration_days=7,
                future_year=2030,
                payment_type='free',
                payment_status='free',
                status='active',
                writer_type='ai',
            )
            db.add(order)
            await db.flush()

            articles = [
                (
                    1, date(2030, 3, 20),
                    '김꿈돌 대표, 드림AI로 아시아 AI 시장 선도',
                    '창업 5년 만에 기업가치 1조 돌파... 포기하지 않은 꿈이 현실이 됐다',
                    '드림AI의 김꿈돌 대표(35)가 오늘 아시아 최대 AI 컨퍼런스 키노트 연사로 나섰다. 청중 5천 명 앞에서 김 대표는 창업 초기의 어려움과 지금의 성공을 담담하게 풀어냈다.',
                ),
                (
                    2, date(2030, 3, 21),
                    '드림AI, 글로벌 VC에서 시리즈B 500억 유치',
                    '소프트뱅크·세쿼이아 동시 투자... 김꿈돌 대표, 다음 목표는 나스닥',
                    '드림AI가 소프트뱅크와 세쿼이아 캐피털로부터 시리즈B 500억 원 투자를 유치했다. 김꿈돌 대표는 이번 투자를 발판 삼아 글로벌 시장 공략을 본격화하겠다고 밝혔다.',
                ),
                (
                    3, date(2030, 3, 22),
                    '김꿈돌의 드림AI, 카카오·네이버와 전략적 파트너십',
                    '한국 AI 생태계 함께 키운다... 3사 공동 R&D 센터 설립',
                    '드림AI가 카카오, 네이버와 손을 잡았다. 세 회사는 공동 AI 연구개발 센터를 설립하고 한국형 AI 모델 개발에 나선다고 발표했다.',
                ),
            ]

            for ep, fdate, headline, subhead, lead in articles:
                body = (
                    f"[{fdate}] {lead} "
                    "드림AI는 현재 임직원 200명 규모로 성장했으며, 매출은 전년 대비 300% 증가했다. "
                    "김꿈돌 대표는 팀원들에게 우리가 함께 만들어가는 이 여정이 자랑스럽다고 전했다."
                )
                db.add(Newspaper(
                    order_id=order_id,
                    episode_number=ep,
                    future_date=fdate,
                    headline=headline,
                    subhead=subhead,
                    lead_paragraph=lead,
                    body_content=body,
                    sidebar_content={
                        'quote': '꿈을 포기하지 않으면 반드시 현실이 됩니다. - 김꿈돌',
                        'stats': [
                            {'label': '기업가치', 'value': '1조 원'},
                            {'label': '임직원', 'value': '200명'},
                        ],
                    },
                    variables_used={'company_name': '드림테크'},
                    status='published',
                    published_at=datetime.now(timezone.utc),
                    view_count=ep * 42,
                    ai_model='gemini-2.0-flash',
                ))
            print(f"  [생성] Order + 신문 3편")
        else:
            print(f"  [스킵] 이미 주문이 있습니다 ({len(existing_orders)}건)")

        await db.commit()

    print()
    print("=" * 50)
    print("테스트 계정 준비 완료!")
    print("=" * 50)
    print()
    print("  [유저]    test_user@dream.com    / Dream1234!")
    print("            → 신문 3편, AI CEO 꿈 시리즈")
    print()
    print("  [작가]    test_writer@dream.com  / Dream1234!")
    print("            → 작가 프로필, 평점 4.8, 24건 완료")
    print()
    print("  [스폰서]  test_sponsor@dream.com / Dream1234!")
    print("            → 드림테크 등록, 슬롯 2개 활성화")

asyncio.run(main())
