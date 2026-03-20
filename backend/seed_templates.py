"""
템플릿 마켓플레이스 샘플 씨드

실행: docker exec dream_backend bash -c "cd /app && uv run python seed_templates.py"
"""
import asyncio, uuid
from datetime import datetime, timezone
from sqlalchemy import select
from app.database import get_db_session
from app.models.template import TemplateSeries, TemplateSlot, TemplateEpisode

WRITER_ID = uuid.UUID('40d22307-f26f-4a2b-aea2-1fc9ae716c92')  # test_writer@dream.com

TEMPLATES = [
    {
        "title": "IT 스타트업 CEO의 7일",
        "description": "[주인공]이 [회사]를 창업하여 [직책]으로 성공을 거두는 이야기",
        "genre": "career",
        "theme": "스타트업 / 테크",
        "duration_days": 7,
        "price_krw": 9900,
        "future_year": 2030,
        "preview_headline": "[주인공] 대표, [회사] AI 서비스로 아시아 시장 석권",
        "preview_lead": "[회사]의 [주인공] [직책]이 오늘 아시아 최대 테크 컨퍼런스에서 기조연설을 맡았다.",
        "slots": [
            {"slot_key": "주인공", "slot_label": "당신의 이름", "slot_hint": "예: 김철수", "slot_category": "identity", "is_required": True, "display_order": 0},
            {"slot_key": "회사", "slot_label": "창업할 회사 이름", "slot_hint": "예: 드림AI", "slot_category": "brand", "is_required": True, "display_order": 1},
            {"slot_key": "직책", "slot_label": "직책", "slot_hint": "예: CEO, 대표이사", "slot_category": "career", "is_required": True, "default_value": "CEO", "display_order": 2},
            {"slot_key": "투자사", "slot_label": "투자 받은 곳", "slot_hint": "예: 소프트뱅크", "slot_category": "brand", "is_required": False, "default_value": "글로벌 VC", "display_order": 3},
            {"slot_key": "기술", "slot_label": "핵심 기술/서비스", "slot_hint": "예: AI 추천 엔진", "slot_category": "achievement", "is_required": False, "default_value": "AI 플랫폼", "display_order": 4},
        ],
        "episodes": [
            {
                "ep": 1, "day_offset": 0,
                "headline": "[주인공] [직책], [회사] AI 서비스로 아시아 시장 석권",
                "subhead": "창업 5년 만에 기업가치 1조 돌파... [투자사] 투자 유치",
                "lead": "[회사]의 [주인공] [직책]이 오늘 아시아 최대 테크 컨퍼런스 키노트 연사로 나섰다. 5천 명 청중 앞에서 [주인공]은 창업 초기의 어려움과 지금의 성공을 담담하게 풀어냈다.",
                "body": "[주인공]이 [회사]를 창업한 것은 불과 5년 전이었다. 당시만 해도 직원 3명의 작은 스타트업이었던 [회사]는 이제 임직원 200명 규모로 성장했다. [기술]을 앞세운 [회사]의 서비스는 현재 아시아 12개국에서 서비스 중이며 누적 이용자 500만 명을 돌파했다. [주인공] [직책]은 '우리 팀원들과 함께 만들어온 이 여정이 자랑스럽다'고 전했다.",
            },
            {
                "ep": 2, "day_offset": 1,
                "headline": "[회사], [투자사]로부터 시리즈B 500억 유치",
                "subhead": "[주인공] [직책] '다음 목표는 나스닥 상장'",
                "lead": "[회사]가 [투자사]로부터 시리즈B 500억 원 투자를 유치했다. [주인공] [직책]은 이번 투자를 발판 삼아 글로벌 시장 공략을 본격화하겠다고 밝혔다.",
                "body": "이번 투자 라운드에는 [투자사] 외에도 국내외 주요 VC들이 참여했다. [회사]의 [기술]은 업계에서 독보적인 기술력을 인정받고 있으며, [주인공] [직책]의 리더십이 투자자들의 신뢰를 얻었다는 평가다. [주인공]은 '투자금은 R&D와 글로벌 인재 영입에 집중 투자할 것'이라고 밝혔다.",
            },
            {
                "ep": 3, "day_offset": 2,
                "headline": "[주인공], 포브스 선정 '아시아 30세 이하 리더 30인' 선정",
                "subhead": "[회사] [직책]으로서의 성취 인정... 업계 최연소 수상",
                "lead": "포브스 아시아가 발표한 '30 Under 30' 리스트에 [주인공] [회사] [직책]이 이름을 올렸다.",
                "body": "포브스 심사위원단은 '[주인공]은 [기술]을 통해 산업의 패러다임을 바꾸고 있다'고 선정 이유를 밝혔다. [회사]는 이번 수상을 기념해 사내 전 직원에게 특별 보너스를 지급했다. [주인공]은 '이 상은 저 혼자가 아니라 [회사] 모든 팀원들의 것'이라고 소감을 전했다.",
            },
            {
                "ep": 4, "day_offset": 3,
                "headline": "[회사], 구글·삼성과 전략적 파트너십 체결",
                "subhead": "[주인공] [직책] '글로벌 기업들이 먼저 손 내밀었다'",
                "lead": "[회사]가 구글과 삼성전자와 동시에 전략적 파트너십을 체결했다. [주인공] [직책]이 직접 협상을 이끌었다.",
                "body": "양측의 파트너십은 [기술] 분야에서의 기술 협력을 핵심으로 한다. 구글은 클라우드 인프라를, 삼성은 하드웨어 생태계를 [회사]에 제공하기로 했다. [주인공]은 '이번 협력으로 [회사]의 [기술]이 전 세계 수억 명에게 닿을 수 있게 됐다'고 밝혔다.",
            },
            {
                "ep": 5, "day_offset": 4,
                "headline": "[주인공], 모교에서 특별 강연 '창업은 실패해도 괜찮다'",
                "subhead": "후배들에게 전하는 [회사] 창업 비화",
                "lead": "[주인공] [회사] [직책]이 모교를 방문해 재학생 1000명 앞에서 창업 경험을 강연했다.",
                "body": "[주인공]은 강연에서 초기 창업 당시 수십 번의 투자 거절을 받았던 경험을 솔직하게 털어놨다. '포기하고 싶었던 적이 없었다면 거짓말'이라고 말한 [주인공]은 '하지만 [기술]에 대한 확신이 있었기에 버텼다'고 회고했다. 강연 후 수백 명의 학생들이 사인 요청을 위해 줄을 섰다.",
            },
            {
                "ep": 6, "day_offset": 5,
                "headline": "[회사] 나스닥 상장 D-30, [주인공]의 뉴욕 행",
                "subhead": "로드쇼 시작... '기업가치 5조 목표'",
                "lead": "[회사]가 나스닥 상장을 한 달 앞두고 [주인공] [직책]이 뉴욕 로드쇼를 시작했다.",
                "body": "월스트리트 주요 기관투자자들을 대상으로 한 로드쇼에서 [주인공]은 [회사]의 [기술]과 성장 가능성을 설득력 있게 발표했다. [투자사] 관계자는 '기관들의 반응이 매우 뜨겁다'고 전했다. [주인공]은 나스닥 상장 후에도 '실리콘밸리에 흔들리지 않고 한국 기업의 정체성을 지키겠다'고 다짐했다.",
            },
            {
                "ep": 7, "day_offset": 6,
                "headline": "[회사] 나스닥 상장 완료, [주인공] '이제 시작이다'",
                "subhead": "공모가 대비 37% 급등 마감... 시가총액 5.3조 달성",
                "lead": "[회사]가 나스닥 시장에 성공적으로 상장하며 [주인공] [직책]의 꿈이 현실이 됐다.",
                "body": "상장 첫날 [회사] 주가는 공모가 대비 37% 상승으로 마감했다. 뉴욕 증권거래소 앞에서 열린 상장 기념식에서 [주인공]은 눈물을 보이며 '5년 전 고시원에서 [기술] 아이디어를 떠올리던 날이 생각난다'고 말했다. [회사] 전 직원들은 한국에서 생중계로 이 순간을 지켜봤으며, 사내 채팅방은 축하 메시지로 가득 찼다.",
            },
        ],
    },
    {
        "title": "세계적 운동선수의 꿈",
        "description": "[주인공]이 [종목] 선수로서 [대회]에서 우승하는 7일간의 이야기",
        "genre": "sports",
        "theme": "스포츠 / 도전",
        "duration_days": 7,
        "price_krw": 9900,
        "future_year": 2030,
        "preview_headline": "[주인공], [대회] 결승전서 극적 역전승",
        "preview_lead": "[종목] 국가대표 [주인공]이 [대회] 결승 무대에 올랐다.",
        "slots": [
            {"slot_key": "주인공", "slot_label": "당신의 이름", "slot_hint": "예: 박지성", "slot_category": "identity", "is_required": True, "display_order": 0},
            {"slot_key": "종목", "slot_label": "스포츠 종목", "slot_hint": "예: 축구, 수영, 테니스", "slot_category": "career", "is_required": True, "display_order": 1},
            {"slot_key": "대회", "slot_label": "목표 대회", "slot_hint": "예: 월드컵, 올림픽", "slot_category": "achievement", "is_required": True, "default_value": "세계선수권", "display_order": 2},
            {"slot_key": "소속팀", "slot_label": "소속 팀/국가", "slot_hint": "예: 대한민국, FC 바르셀로나", "slot_category": "career", "is_required": False, "default_value": "대한민국", "display_order": 3},
            {"slot_key": "멘토", "slot_label": "나의 멘토/코치", "slot_hint": "예: 히딩크 감독", "slot_category": "relationship", "is_required": False, "default_value": "수석 코치", "display_order": 4},
        ],
        "episodes": [
            {
                "ep": 1, "day_offset": 0,
                "headline": "[소속팀] [주인공], [대회] 8강 진출 쾌거",
                "subhead": "[종목] [멘토]의 전술이 빛났다... [주인공] 2골 1도움",
                "lead": "[소속팀] 소속 [종목] 선수 [주인공]이 [대회] 8강 진출에 결정적 역할을 했다.",
                "body": "[주인공]은 이번 경기에서 전반 23분 선제골에 이어 후반 71분 추가골을 터뜨리며 팀 승리를 이끌었다. [멘토]는 경기 후 '[주인공]은 압박 상황에서도 흔들리지 않는 멘탈이 있다'며 칭찬을 아끼지 않았다. 팬들은 경기장 밖에서 [주인공]의 이름을 연호했다.",
            },
            {
                "ep": 2, "day_offset": 1,
                "headline": "[주인공], [대회] MVP 후보 1위 선정",
                "subhead": "국제 스포츠 미디어 선정 '이번 대회 최고의 선수'",
                "lead": "[종목] 전문 매체들이 [주인공]을 [대회] 최우수 선수 후보 1위로 꼽았다.",
                "body": "ESPN, 스포츠 일러스트레이티드 등 주요 스포츠 미디어들이 [주인공]의 활약을 집중 조명했다. [주인공]은 대회 통산 5골 3도움으로 득점 1위를 달리고 있다. [소속팀] 동료들은 '[주인공]이 팀의 심장'이라고 입을 모았다.",
            },
            {
                "ep": 3, "day_offset": 2,
                "headline": "[주인공], [대회] 4강서 세계 랭킹 1위 격파",
                "subhead": "[멘토] '이건 기적이 아니라 노력의 결과'",
                "lead": "[주인공]이 세계 랭킹 1위 강자를 꺾으며 [대회] 결승에 진출했다.",
                "body": "아무도 예상하지 못한 결과였다. [주인공]은 상대의 강력한 압박에도 불구하고 침착하게 경기를 풀어나갔다. [멘토]의 전술 지도가 빛을 발했다. 경기 후 인터뷰에서 [주인공]은 '[멘토]와 함께라면 어떤 상대도 두렵지 않다'고 밝혔다.",
            },
            {
                "ep": 4, "day_offset": 3,
                "headline": "[소속팀] 국민들의 응원, 전국이 [주인공]을 외친다",
                "subhead": "결승 앞두고 응원 열기 최고조",
                "lead": "[대회] 결승을 앞두고 [소속팀] 전국이 [주인공]을 향한 응원 열기로 뜨겁다.",
                "body": "포털 사이트 실시간 검색어 1위는 '{{주인공}} 결승'이 점령했다. 편의점에서는 [주인공] 관련 굿즈가 완판됐으며, 각 지역 광장에는 응원전이 펼쳐졌다. [주인공]의 고향 마을에서는 마을 전체가 [소속팀] 유니폼을 입고 응원에 나섰다.",
            },
            {
                "ep": 5, "day_offset": 4,
                "headline": "[주인공], [대회] 결승전서 극적 역전승",
                "subhead": "후반 89분 결승골... [소속팀] 역사적 우승",
                "lead": "[주인공]이 [대회] 결승전에서 후반 추가시간 극적인 결승골을 터뜨리며 우승을 이끌었다.",
                "body": "0-1로 뒤지던 [소속팀]은 후반 89분 [주인공]의 왼발 슈팅으로 동점을 만든 데 이어, 연장전에서 [주인공]의 헤더 결승골로 역전에 성공했다. 경기 후 [주인공]은 그라운드에 무릎을 꿇고 눈물을 흘렸다. [멘토]는 달려와 [주인공]을 끌어안았다.",
            },
            {
                "ep": 6, "day_offset": 5,
                "headline": "[주인공], [대회] MVP·득점왕·도움왕 트리플 크라운",
                "subhead": "대회 역사상 최초 기록... '전설'로 등극",
                "lead": "[주인공]이 [대회] MVP, 득점왕, 도움왕을 동시에 수상하며 대회 역사상 최초의 트리플 크라운을 달성했다.",
                "body": "시상식에서 [주인공]은 '이 상은 나 혼자 받는 것이 아니다. [멘토], 팀원들, 그리고 응원해주신 [소속팀] 팬들과 함께 받는 상'이라고 소감을 밝혔다. 국제 [종목] 연맹 회장은 '[주인공]은 이 시대 최고의 선수'라고 극찬했다.",
            },
            {
                "ep": 7, "day_offset": 6,
                "headline": "영웅 귀환, [소속팀] 환영 인파 100만 명",
                "subhead": "[주인공] '이 모든 것이 꿈만 같다'",
                "lead": "[대회] 우승 트로피를 들고 귀국한 [주인공]을 맞이하기 위해 100만 명의 인파가 거리로 나왔다.",
                "body": "공항부터 시청까지 이어진 카퍼레이드 내내 [주인공]은 팬들을 향해 손을 흔들었다. [주인공]의 눈가는 계속 촉촉했다. '어릴 때 [종목] 선수가 되겠다는 꿈을 꿨을 때 모두가 말렸다. 하지만 나는 믿었다. 꿈을 포기하지 않으면 반드시 이루어진다는 것을'이라고 말했다.",
            },
        ],
    },
]


async def main():
    async with get_db_session() as db:
        for tmpl_data in TEMPLATES:
            # 중복 체크
            existing = (await db.execute(
                select(TemplateSeries).where(
                    TemplateSeries.writer_id == WRITER_ID,
                    TemplateSeries.title == tmpl_data["title"]
                )
            )).scalar_one_or_none()

            if existing:
                print(f"  [스킵] '{tmpl_data['title']}' 이미 존재")
                continue

            template = TemplateSeries(
                writer_id=WRITER_ID,
                title=tmpl_data["title"],
                description=tmpl_data["description"],
                genre=tmpl_data["genre"],
                theme=tmpl_data["theme"],
                duration_days=tmpl_data["duration_days"],
                price_krw=tmpl_data["price_krw"],
                future_year=tmpl_data["future_year"],
                preview_headline=tmpl_data["preview_headline"],
                preview_lead=tmpl_data["preview_lead"],
                status="listed",
            )
            db.add(template)
            await db.flush()

            for s in tmpl_data["slots"]:
                db.add(TemplateSlot(
                    template_id=template.id,
                    slot_key=s["slot_key"],
                    slot_label=s["slot_label"],
                    slot_hint=s.get("slot_hint"),
                    slot_category=s["slot_category"],
                    is_required=s["is_required"],
                    default_value=s.get("default_value"),
                    display_order=s["display_order"],
                ))

            for i, ep in enumerate(tmpl_data["episodes"]):
                db.add(TemplateEpisode(
                    template_id=template.id,
                    episode_number=ep["ep"],
                    day_offset=ep["day_offset"],
                    headline_template=ep["headline"],
                    subhead_template=ep["subhead"],
                    lead_paragraph_template=ep["lead"],
                    body_content_template=ep["body"],
                ))

            await db.commit()
            slot_keys = [s["slot_key"] for s in tmpl_data["slots"]]
            print(f"  [생성] '{tmpl_data['title']}' — 슬롯: {slot_keys}")

    print("\n✅ 템플릿 씨드 완료!")


if __name__ == "__main__":
    asyncio.run(main())
