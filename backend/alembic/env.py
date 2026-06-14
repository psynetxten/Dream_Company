import asyncio
import os
from logging.config import fileConfig
from urllib.parse import urlparse, unquote
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.engine.url import URL as SaURL
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

# 모든 모델 임포트 (마이그레이션 자동 감지)
from app.database import Base
from app.models import *  # noqa: F401, F403

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> SaURL:
    """DB URL을 Python urlparse로 안전하게 파싱 (패스워드 내 @ 문자 지원)."""
    raw = os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url", ""))
    for prefix in ["postgresql+psycopg://", "postgresql+asyncpg://", "postgres://"]:
        if raw.startswith(prefix):
            raw = "postgresql://" + raw[len(prefix):]
            break
    p = urlparse(raw)
    return SaURL.create(
        "postgresql+psycopg",
        username=p.username,
        password=unquote(p.password or ""),
        host=p.hostname,
        port=p.port,
        database=(p.path or "/postgres").lstrip("/"),
    )


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(get_url(), poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
