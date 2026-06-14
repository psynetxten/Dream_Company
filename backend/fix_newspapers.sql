-- EP1: body=plain text, sidebar=quote+stats
UPDATE newspapers SET
  body_content = '"드림AI는 지난 3년간 김테스트 대표의 리더십 아래 급성장했다. 창업 초기 3명으로 시작한 팀은 현재 전 세계 17개국에 280명의 인재를 두고 있으며, 월 활성 사용자 200만 명을 보유한 B2B SaaS 플랫폼으로 자리매김했다.\n\n특히 드림AI의 핵심 제품인 DreamTranslate는 실시간 다국어 번역 정확도에서 기존 솔루션 대비 43% 향상된 성능을 보이며, 삼성전자 현대자동차 LG전자 등 국내 대기업 50개사가 도입했다.\n\n미래드림 IT의 전략적 파트너십도 드림AI의 성장을 이끈 주요 동력 중 하나다. 두 회사는 AI 개발 인프라 공동 구축을 통해 개발 속도를 30% 이상 향상시켰다."'::jsonb,
  sidebar_content = '{"quote": "세계 무대에서 한국 AI 기업의 가능성을 증명하는 것이 저의 사명입니다.", "stats": [{"label": "투자 유치액", "value": "500억"}, {"label": "진출 국가", "value": "17개국"}, {"label": "월 활성 사용자", "value": "200만"}], "episode_summary": "김테스트가 설립한 드림AI가 시리즈B 500억 투자를 유치하며 글로벌 AI 기업으로 도약했다."}'::jsonb
WHERE order_id = 'e20032dc-0d83-45f0-8083-80b855c224b1' AND episode_number = 1;

-- EP2
UPDATE newspapers SET
  body_content = '"다보스 포럼 메인 홀에 모인 3,000여 명의 글로벌 리더들은 김테스트 대표의 연설에 집중했다. 기술은 도구입니다. 중요한 것은 그 도구를 어떻게 사람을 위해 사용하느냐입니다. 김테스트의 이 한 마디는 포럼 전체를 관통하는 메시지가 됐다.\n\n연설 이후 마이크로소프트 CEO와 비공개 미팅을 가진 김테스트는 글로벌 파트너십 가능성을 논의한 것으로 알려졌다. 구글, 애플 등 빅테크 기업들도 드림AI와의 협력 의향을 타진하고 있다."'::jsonb,
  sidebar_content = '{"quote": "기술은 사람을 위해 존재합니다. 저는 그 믿음 하나로 여기까지 왔습니다.", "stats": [{"label": "포럼 참가자", "value": "3,000명"}, {"label": "비공개 미팅", "value": "5개사"}], "episode_summary": "김테스트가 다보스 포럼 메인 무대에서 AI 혁신 방향을 제시하며 글로벌 리더로 인정받았다."}'::jsonb
WHERE order_id = 'e20032dc-0d83-45f0-8083-80b855c224b1' AND episode_number = 2;

-- EP3
UPDATE newspapers SET
  body_content = '"파리 유네스코 본부에서 열린 시상식에서 김테스트 대표는 수익을 창출하면서도 사회에 기여하는 것이 AI 기업의 책임이라고 강조했다. 드림AI의 무료 교육 플랫폼 DreamLearn은 현재 97개국 120만 명의 학생들이 사용 중이며, 해당 지역 학업 성취도를 평균 37% 향상시킨 것으로 측정됐다.\n\n미래드림 IT와의 전략적 파트너십을 통해 드림AI는 지속 가능한 AI 교육 생태계를 구축하고 있다. 두 회사는 내년까지 50개국 추가 진출을 목표로 하고 있다."'::jsonb,
  sidebar_content = '{"quote": "돈을 버는 것과 세상을 바꾸는 것은 함께 갈 수 있습니다.", "stats": [{"label": "수혜 학생", "value": "120만 명"}, {"label": "진출 국가", "value": "97개국"}, {"label": "성취도 향상", "value": "37%"}], "episode_summary": "드림AI가 교육 AI로 유네스코상을 받으며 사회적 책임을 다하는 글로벌 기업으로 자리매김했다."}'::jsonb
WHERE order_id = 'e20032dc-0d83-45f0-8083-80b855c224b1' AND episode_number = 3;

SELECT episode_number,
  left(body_content::text, 60) as body_preview,
  sidebar_content->'quote' as quote
FROM newspapers
WHERE order_id = 'e20032dc-0d83-45f0-8083-80b855c224b1'
ORDER BY episode_number;
