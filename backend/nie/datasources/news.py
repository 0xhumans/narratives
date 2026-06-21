"""RSS / news feed connector. Returns recent headlines for a narrative."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import feedparser

log = logging.getLogger(__name__)

DEFAULT_FEEDS: tuple[str, ...] = (
    "https://feeds.bloomberg.com/markets/news.rss",
    "https://www.ft.com/rss/home",
    "https://feeds.reuters.com/reuters/businessNews",
    "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    "https://seekingalpha.com/market_currents.xml",
)


async def fetch_headlines(query: str, limit: int = 8, feeds: tuple[str, ...] | None = None) -> list[str]:
    """Fetch and filter headlines matching the query from RSS feeds.

    Runs feedparser in a thread executor (it is blocking). Best-effort: returns
    an empty list on any failure.
    """
    feeds = feeds or DEFAULT_FEEDS
    q = query.lower()

    def _parse() -> list[str]:
        matches: list[str] = []
        for url in feeds:
            try:
                parsed = feedparser.parse(url)
            except Exception as exc:  # noqa: BLE001
                log.debug("feed %s failed: %s", url, exc)
                continue
            for entry in parsed.entries:
                title = entry.get("title", "")
                summary = entry.get("summary", "")
                haystack = (title + " " + summary).lower()
                # Match if any query word appears
                if any(token in haystack for token in q.split()):
                    matches.append(title.strip())
                if len(matches) >= limit:
                    return matches[:limit]
        return matches[:limit]

    try:
        return await asyncio.to_thread(_parse)
    except Exception as exc:  # noqa: BLE001
        log.warning("news fetch failed for '%s': %s", query, exc)
        return []


async def gather_context(query: str) -> dict[str, Any]:
    """Return a context dict with news headlines for the narrative."""
    return {"news": await fetch_headlines(query)}
