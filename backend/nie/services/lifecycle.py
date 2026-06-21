"""Map narratives onto a 5-phase adoption lifecycle."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nie.db.models import Narrative, NarrativeKind, Score
from nie.schemas.narrative import LifecycleMapData, LifecycleNarrativeItem, LifecyclePhase

PHASES: tuple[LifecyclePhase, ...] = (
    LifecyclePhase(
        id="emerging",
        label="Emerging",
        subtitle="Innovation & early signals",
        order=1,
    ),
    LifecyclePhase(
        id="accelerating",
        label="Accelerating",
        subtitle="Early adoption & inflection",
        order=2,
    ),
    LifecyclePhase(
        id="scaling",
        label="Scaling",
        subtitle="Early majority & rapid scale",
        order=3,
    ),
    LifecyclePhase(
        id="mainstream",
        label="Mainstream",
        subtitle="Late majority & broad adoption",
        order=4,
    ),
    LifecyclePhase(
        id="saturation",
        label="Saturation",
        subtitle="Maturity & slowing growth",
        order=5,
    ),
)


def _penetration(adoption: dict | None) -> float | None:
    if not adoption:
        return None
    raw = adoption.get("penetration_pct")
    if raw is None:
        return None
    try:
        return float(raw)
    except (TypeError, ValueError):
        return None


def normalize_lifecycle_phase(stage: str | None, penetration: float | None) -> str:
    s = (stage or "").lower()

    if any(k in s for k in ("saturation", "maturity", "mature", "peak", "declining")):
        return "saturation"
    if "late majority" in s and "early" not in s:
        return "mainstream"
    if any(k in s for k in ("mainstream", "mass adoption", "ubiquitous")):
        return "mainstream"
    if any(
        k in s
        for k in (
            "early majority",
            "scaling",
            "slope of enlightenment",
            "inflection",
            "hypergrowth",
            "rapid growth",
        )
    ):
        return "scaling"
    if any(
        k in s
        for k in (
            "early adoption",
            "early adopter",
            "commercialization",
            "early growth",
            "accelerat",
            "crossing",
        )
    ):
        return "accelerating"
    if any(
        k in s
        for k in (
            "innovator",
            "innovation",
            "nascent",
            "emerging",
            "pioneer",
            "research",
            "trough",
            "experiment",
        )
    ):
        return "emerging"

    if penetration is not None:
        if penetration >= 75:
            return "saturation"
        if penetration >= 50:
            return "mainstream"
        if penetration >= 25:
            return "scaling"
        if penetration >= 8:
            return "accelerating"
        return "emerging"

    return "accelerating"


async def build_lifecycle_map(session: AsyncSession) -> LifecycleMapData:
    rows = (
        await session.execute(
            select(Narrative, Score)
            .join(Score, Score.narrative_id == Narrative.id)
            .where(Score.opportunity_id.is_(None))
            .options(selectinload(Narrative.parent))
            .order_by(Narrative.name)
        )
    ).all()

    items: list[LifecycleNarrativeItem] = []
    by_phase: dict[str, list[LifecycleNarrativeItem]] = {p.id: [] for p in PHASES}

    for narrative, score in rows:
        adoption = narrative.adoption_curve or {}
        penetration = _penetration(adoption)
        phase_id = normalize_lifecycle_phase(adoption.get("stage"), penetration)
        mega_name = narrative.name
        if narrative.kind == NarrativeKind.sub and narrative.parent:
            mega_name = narrative.parent.name

        item = LifecycleNarrativeItem(
            id=narrative.id,
            slug=narrative.slug,
            name=narrative.name,
            kind=narrative.kind.value,
            mega_name=mega_name,
            phase_id=phase_id,
            stage_raw=adoption.get("stage"),
            composite=float(score.composite),
            penetration_pct=penetration,
            is_leader=False,
        )
        items.append(item)
        by_phase[phase_id].append(item)

    for phase_items in by_phase.values():
        phase_items.sort(key=lambda x: (-x.composite, x.name.lower()))
        for leader in phase_items[:3]:
            leader.is_leader = True

    items.sort(key=lambda x: (-x.composite, x.name.lower()))
    return LifecycleMapData(phases=list(PHASES), narratives=items)
