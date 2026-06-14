FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --no-install-project

COPY . .

# Render는 $PORT 환경변수를 주입함 (기본 10000)
ENV PORT=8000

# alembic 실패해도 uvicorn은 무조건 시작 (DB 연결 오류 시 앱은 뜨고 로그로 확인)
CMD uv run alembic upgrade head; uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --loop asyncio
