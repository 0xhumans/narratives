"""Alembic env: uses sync engine derived from the async DATABASE_URL."""
from __future__ import annotations

import asyncio
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import AsyncEngine

from alembic import context
from nie.config import _cleaned_db_url, settings
from nie.db.base import Base
from nie.db import models  # noqa: F401  (register models on metadata)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Use the async URL with asyncpg swapped for psycopg2 (sync) for offline migrations.
# sslmode is preserved since psycopg2 understands it.
_sync_url = _cleaned_db_url.replace("+asyncpg", "+psycopg2").replace(
    "postgresql+psycopg2://", "postgresql://"
)
config.set_main_option("sqlalchemy.url", _sync_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=_sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
