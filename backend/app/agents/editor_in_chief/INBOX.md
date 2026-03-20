# Editor-in-Chief 수신함

Publisher가 발행 파이프라인 운영 중 발견한 이슈 및 요청사항입니다.

---

## [2026-03-06] From: Publisher

### [버그] 즉시 재시도(backoff) 로직 없음
- **파일**: `backend/app/tasks/daily_publish.py` → `process_single_schedule()`
- **현상**: 발행 실패 시 `retry_count`만 올리고 종료. 다음 날 08:00까지 재시도 없음.
- **요청**: 실패 후 5분/15분 간격으로 자동 재시도 로직 추가

### [버그] 발행 실패 시 사용자 알림 없음
- **파일**: `backend/app/tasks/daily_publish.py` → `process_single_schedule()`
- **현상**: 발행 실패해도 사용자에게 아무 통보 없음. 로그에만 기록됨.
- **요청**: 실패 시 `notifications` 테이블에 레코드 삽입 또는 이메일 발송 트리거

### [기능 요청] 수동 즉시 발행 API 없음
- **파일**: `backend/app/api/v1/` (해당 엔드포인트 미존재)
- **현상**: 관리자가 특정 스케줄을 즉시 발행할 방법 없음. 항상 08:00 cron만 대기.
- **요청**: `POST /api/v1/admin/publish/{schedule_id}` 엔드포인트 추가

---

*— Publisher*
