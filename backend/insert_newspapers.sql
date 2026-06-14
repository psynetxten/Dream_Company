DELETE FROM newspapers WHERE order_id='e20032dc-0d83-45f0-8083-80b855c224b1';

INSERT INTO newspapers (
    id, order_id, episode_number, future_date, future_date_label,
    headline, subhead, lead_paragraph, body_content, sidebar_content,
    variables_used, ai_model, generation_ms, status,
    published_at, scheduled_at, created_at, updated_at
) VALUES
(
    gen_random_uuid(), 'e20032dc-0d83-45f0-8083-80b855c224b1', 1, '2030-03-14', '2030년 3월 14일',
    '김테스트 대표, 글로벌 AI 스타트업 드림AI 시리즈B 500억 투자 유치 성공',
    '3년 만에 17개국 진출, 월 활성 사용자 200만 돌파',
    '글로벌 AI 기업 드림AI의 김테스트 대표가 세계 최대 벤처캐피털 Sequoia Capital로부터 500억 원 규모의 시리즈B 투자를 유치했다. 이번 투자는 한국 AI 스타트업 역사상 세 번째로 큰 규모로, 드림AI의 혁신적인 언어 모델 기술력과 빠른 글로벌 확장 능력을 인정받은 결과다.',
    '{"main": "드림AI는 지난 3년간 김테스트 대표의 리더십 아래 급성장했다.", "quote": "세계 무대에서 한국 AI 기업의 가능성을 증명하는 것이 저의 사명입니다. 김테스트 드림AI 대표"}',
    '{"key_facts": ["투자 유치액: 시리즈B 500억 원", "진출 국가: 17개국", "월 활성 사용자: 200만 명"], "episode_summary": "김테스트가 설립한 드림AI가 시리즈B 500억 투자를 유치하며 글로벌 AI 기업으로 도약했다."}',
    '{"protagonist": "김테스트", "sponsor": "미래드림 IT"}',
    'test-seed', 0, 'published', NOW(), NOW(), NOW(), NOW()
),
(
    gen_random_uuid(), 'e20032dc-0d83-45f0-8083-80b855c224b1', 2, '2030-03-15', '2030년 3월 15일',
    '드림AI 김테스트, 세계경제포럼 다보스 연단에 서다',
    'AI 시대의 인간 중심 혁신을 주제로 전 세계 리더들과 대화',
    '드림AI의 김테스트 대표가 세계경제포럼(WEF) 다보스 포럼의 메인 무대에 초청받아 AI 시대의 인간 중심 혁신을 주제로 기조연설을 진행했다. 1년 전까지만 해도 스타트업 창업가였던 김테스트가 세계 최고의 무대에 선 것이다.',
    '{"main": "다보스 포럼 메인 홀에 모인 3,000여 명의 글로벌 리더들은 김테스트 대표의 연설에 집중했다.", "quote": "기술은 사람을 위해 존재합니다. 저는 그 믿음 하나로 여기까지 왔습니다. 김테스트"}',
    '{"key_facts": ["포럼 참가자: 전 세계 3,000명", "연설 주제: AI 시대 인간 중심 혁신"], "episode_summary": "김테스트가 다보스 포럼 메인 무대에서 AI 혁신 방향을 제시하며 글로벌 리더로 인정받았다."}',
    '{"protagonist": "김테스트", "sponsor": "미래드림 IT"}',
    'test-seed', 0, 'published', NOW(), NOW(), NOW(), NOW()
),
(
    gen_random_uuid(), 'e20032dc-0d83-45f0-8083-80b855c224b1', 3, '2030-03-16', '2030년 3월 16일',
    '김테스트의 드림AI, 유네스코 글로벌 AI 혁신상 수상',
    '교육 불평등 해소 기여로 전 세계 97개국 AI 기업 중 최고상 수상',
    '드림AI가 유네스코로부터 2030 글로벌 AI 혁신상을 수상했다. 드림AI의 무료 교육 AI 플랫폼이 아프리카와 동남아시아 등 교육 소외 지역 120만 명의 학생에게 양질의 교육을 제공한 공로가 인정됐다.',
    '{"main": "파리 유네스코 본부에서 열린 시상식에서 김테스트 대표는 수익을 창출하면서도 사회에 기여하는 것이 AI 기업의 책임이라고 강조했다.", "quote": "돈을 버는 것과 세상을 바꾸는 것은 함께 갈 수 있습니다. 김테스트"}',
    '{"key_facts": ["수상: 유네스코 글로벌 AI 혁신상", "수혜 학생 수: 120만 명", "진출 국가: 97개국"], "episode_summary": "드림AI가 교육 AI로 유네스코상을 받으며 사회적 책임을 다하는 글로벌 기업으로 자리매김했다."}',
    '{"protagonist": "김테스트", "sponsor": "미래드림 IT"}',
    'test-seed', 0, 'published', NOW(), NOW(), NOW(), NOW()
);

SELECT episode_number, left(headline, 50) as headline, status FROM newspapers WHERE order_id='e20032dc-0d83-45f0-8083-80b855c224b1' ORDER BY episode_number;
