"""Knowledge-base document loader."""
from __future__ import annotations

from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nie.db.models import KBDocument

MAX_EXCERPT_CHARS = 2000


async def list_kb_excerpts(session: AsyncSession, limit: int = 6) -> list[str]:
    """Return up to `limit` KB document excerpts for use as LLM context."""
    rows = (
        await session.execute(select(KBDocument).order_by(KBDocument.created_at.desc()).limit(limit))
    ).scalars().all()
    return [doc.content[:MAX_EXCERPT_CHARS] for doc in rows if doc.content]


def load_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")
