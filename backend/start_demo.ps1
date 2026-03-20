$env:DATABASE_URL="sqlite+aiosqlite:///C:/Users/default.DESKTOP-BKS2NBV/OneDrive/Desktop/꿈신문사 CTO/dream-newspaper/backend/dream_newspaper.db"
$env:DEBUG="True"
uv run uvicorn app.main:app --port 8000 --host 127.0.0.1
