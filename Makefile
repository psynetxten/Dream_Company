.PHONY: setup dev stop clean migrate test logs restart-backend lint

# ============================
# 최초 설정
# ============================
setup:
	cp .env.example .env
	@echo ""
	@echo "==================================="
	@echo " .env 파일을 열어 설정을 완료하세요"
	@echo " 필수: ANTHROPIC_API_KEY"
	@echo " 필수: SECRET_KEY"
	@echo "==================================="

# ============================
# 개발 서버 시작 (전체)
# ============================
dev:
	docker compose up --build

dev-d:
	docker compose up --build -d

# ============================
# 서비스 중지
# ============================
stop:
	docker compose down

# ============================
# 데이터 포함 완전 삭제
# ============================
clean:
	docker compose down -v --remove-orphans
	@echo "모든 컨테이너 및 볼륨이 삭제됐습니다."

# ============================
# DB 마이그레이션
# ============================
migrate:
	docker compose exec backend uv run alembic upgrade head

migrate-down:
	docker compose exec backend uv run alembic downgrade -1

migrate-history:
	docker compose exec backend uv run alembic history

# ============================
# 테스트
# ============================
test:
	docker compose exec backend uv run pytest -v

test-cov:
	docker compose exec backend uv run pytest --cov=app --cov-report=html

# ============================
# 로그
# ============================
logs:
	docker compose logs -f backend

logs-all:
	docker compose logs -f

# ============================
# 백엔드만 재시작
# ============================
restart-backend:
	docker compose restart backend

# ============================
# 린트 & 포맷
# ============================
lint:
	docker compose exec backend uv run ruff check app/

format:
	docker compose exec backend uv run ruff format app/

# ============================
# 백엔드 의존성 설치 (로컬)
# ============================
install-backend:
	cd backend && uv sync

# ============================
# 프론트엔드 의존성 설치
# ============================
install-frontend:
	cd frontend && npm install

# ============================
# ChromaDB 기업 데이터 로드
# ============================
load-companies:
	docker compose exec backend uv run python -m app.agents.sponsor_matcher.company_db_loader
