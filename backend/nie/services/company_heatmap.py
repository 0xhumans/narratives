"""Aggregate company importance across mega narratives from opportunity winners."""
from __future__ import annotations

import re
import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nie.db.models import Narrative, NarrativeKind, Opportunity, Score
from nie.schemas.narrative import CompanyHeatmapData, CompanyHeatmapRow, MegaColumn

_SUFFIXES = (
    " incorporated",
    " inc.",
    " inc",
    " corp.",
    " corp",
    " corporation",
    " ltd.",
    " ltd",
    " limited",
    " plc",
    " co.",
    " co",
    " company",
    " group",
    " holdings",
    " electronics",
    " semiconductor",
    " semiconductors",
    " technology",
    " technologies",
)

# Parenthetical content that looks like a ticker, not a description.
_TICKER_IN_PARENS = re.compile(
    r"\(\s*(?:[A-Z]{2,5}:)?([A-Z0-9]{1,5}(?:\.[A-Z]{1,2})?)\s*\)"
)


def _extract_ticker(text: str) -> str | None:
    for match in _TICKER_IN_PARENS.finditer(text):
        token = match.group(1).strip()
        if ":" in token:
            token = token.split(":")[-1].strip()
        base = token.split(".")[0]
        # Real tickers are short uppercase/alphanumeric (e.g. 3M, TXG, ABBN)
        if re.fullmatch(r"[A-Z0-9]{1,5}", base) and base.isascii():
            return base
    return None


def _strip_suffix(name: str) -> str:
    lowered = name.lower().strip()
    for suffix in _SUFFIXES:
        if lowered.endswith(suffix):
            return name[: -len(suffix)].strip(" ,")
    return name.strip()


def _company_head(text: str) -> str:
    """Leading company name without descriptions, dashes, or parentheticals."""
    head = re.split(r"\s[-–—]\s", text, maxsplit=1)[0].strip()
    head = _TICKER_IN_PARENS.sub("", head)
    head = re.sub(r"\([^)]*\)", "", head)
    head = re.sub(r"\s+", " ", head).strip(" ,.;")
    return _strip_suffix(head)


def _canonical_key(text: str) -> tuple[str, str, str | None]:
    """Return (dedupe_key, display_name, ticker_or_none)."""
    raw = str(text).strip()
    if not raw:
        return "", "", None

    ticker = _extract_ticker(raw)
    head = _company_head(raw)
    if not head and ticker:
        head = ticker

    normalized = re.sub(r"\s+", " ", head).strip().lower()
    key = _strip_suffix(normalized).lower()
    if not key:
        key = re.sub(r"[^a-z0-9]+", " ", raw.lower()).strip()

    display = head or raw
    if ticker and f"({ticker})" not in display:
        display = f"{display} ({ticker})"

    return key, display, ticker


def _pick_display(candidates: list[str], ticker: str | None) -> str:
    """Shortest clean label wins; append ticker once if known."""
    heads = [_company_head(c) for c in candidates if c.strip()]
    heads = [h for h in heads if h]
    base = min(heads, key=len) if heads else (candidates[0] if candidates else "")
    base = _strip_suffix(base)
    if ticker and not re.search(rf"\({re.escape(ticker)}\)", base, re.I):
        return f"{base} ({ticker})"
    return base


def _overall_score(mega_scores: dict[str, float]) -> tuple[float, int]:
    active = [v for v in mega_scores.values() if v > 0]
    if not active:
        return 0.0, 0
    avg = sum(active) / len(active)
    junction_bonus = min(2.0, max(0, len(active) - 1) * 0.45)
    return min(10.0, round(avg + junction_bonus, 2)), len(active)


def _weighted_score(narrative_scores: dict[uuid.UUID, float]) -> tuple[float, int]:
    """Score from per-narrative maxima: avg × breadth multiplier (0–10)."""
    active = [v for v in narrative_scores.values() if v > 0]
    if not active:
        return 0.0, 0
    avg = sum(active) / len(active)
    breadth = 1.0 + 0.12 * min(len(active) - 1, 12)
    return min(10.0, round(avg * breadth, 2)), len(active)


async def build_company_heatmap(session: AsyncSession) -> CompanyHeatmapData:
    megas = (
        await session.execute(
            select(Narrative)
            .where(Narrative.kind == NarrativeKind.mega)
            .order_by(Narrative.name)
        )
    ).scalars().all()

    all_narratives = (await session.execute(select(Narrative))).scalars().all()
    mega_for: dict[uuid.UUID, uuid.UUID] = {}
    for n in all_narratives:
        if n.kind == NarrativeKind.mega:
            mega_for[n.id] = n.id
        elif n.parent_id:
            mega_for[n.id] = n.parent_id

    slug_by_mega_id = {m.id: m.slug for m in megas}
    columns = [
        MegaColumn(narrative_id=m.id, slug=m.slug, name=m.name) for m in megas
    ]

    rows_raw = (
        await session.execute(
            select(Opportunity, Score).join(Score, Score.opportunity_id == Opportunity.id)
        )
    ).all()

    scores: dict[str, dict[str, float]] = defaultdict(dict)
    narrative_scores: dict[str, dict[uuid.UUID, float]] = defaultdict(dict)
    display_pool: dict[str, list[str]] = defaultdict(list)
    tickers: dict[str, str | None] = {}
    opp_counts: dict[str, int] = defaultdict(int)

    for opp, score in rows_raw:
        mega_id = mega_for.get(opp.narrative_id)
        if not mega_id or mega_id not in slug_by_mega_id:
            continue
        mega_slug = slug_by_mega_id[mega_id]
        importance = float(score.composite)

        for winner in opp.potential_winners or []:
            key, display, ticker = _canonical_key(winner)
            if not key:
                continue
            if importance <= 0:
                continue

            prev = scores[key].get(mega_slug, 0.0)
            scores[key][mega_slug] = max(prev, importance)
            prev_n = narrative_scores[key].get(opp.narrative_id, 0.0)
            narrative_scores[key][opp.narrative_id] = max(prev_n, importance)
            opp_counts[key] += 1
            display_pool[key].append(display)
            if ticker:
                existing = tickers.get(key)
                if not existing or len(ticker) <= len(existing):
                    tickers[key] = ticker

    heatmap_rows: list[CompanyHeatmapRow] = []
    for key, mega_scores in scores.items():
        full_scores = {col.slug: round(mega_scores.get(col.slug, 0.0), 2) for col in columns}
        composite, mega_count = _overall_score(full_scores)
        weighted, narrative_count = _weighted_score(narrative_scores.get(key, {}))
        if mega_count == 0 and narrative_count == 0:
            continue
        present_megas = [col.name for col in columns if full_scores[col.slug] > 0]
        label = _pick_display(display_pool[key], tickers.get(key))

        heatmap_rows.append(
            CompanyHeatmapRow(
                company=label,
                company_key=key,
                ticker=tickers.get(key),
                scores=full_scores,
                narrative_count=narrative_count,
                mega_count=mega_count,
                opportunity_count=opp_counts[key],
                composite=composite,
                weighted_score=weighted,
                rank=None,
                megas=present_megas,
            )
        )

    heatmap_rows.sort(
        key=lambda r: (-r.weighted_score, -r.narrative_count, -r.mega_count, r.company.lower())
    )

    rank = 0
    for row in heatmap_rows:
        if row.ticker:
            rank += 1
            row.rank = rank

    return CompanyHeatmapData(columns=columns, rows=heatmap_rows)
