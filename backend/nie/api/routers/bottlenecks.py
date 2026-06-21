"""Bottleneck endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nie.db.base import get_session
from nie.db.models import Bottleneck, BottleneckTier, Narrative, NarrativeKind
from nie.schemas.narrative import BottleneckOut

router = APIRouter(prefix="/api/bottlenecks", tags=["bottlenecks"])


def _bottleneck_out(b: Bottleneck) -> BottleneckOut:
    n = b.narrative
    mega_name = n.name
    if n.kind == NarrativeKind.sub and n.parent:
        mega_name = n.parent.name
    return BottleneckOut(
        id=b.id,
        narrative_id=b.narrative_id,
        narrative_name=n.name,
        narrative_slug=n.slug,
        mega_name=mega_name,
        tier=b.tier.value,
        name=b.name,
        cause=b.cause,
        severity=b.severity,
        time_horizon=b.time_horizon,
        market_awareness=b.market_awareness,
        winners=b.winners or [],
        losers=b.losers or [],
    )


@router.get("", response_model=list[BottleneckOut])
async def list_bottlenecks(
    tier: BottleneckTier | None = None,
    narrative_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    q = (
        select(Bottleneck)
        .options(
            selectinload(Bottleneck.narrative).selectinload(Narrative.parent),
        )
        .order_by(Bottleneck.severity.desc())
    )
    if tier:
        q = q.where(Bottleneck.tier == tier)
    if narrative_id:
        q = q.where(Bottleneck.narrative_id == narrative_id)
    rows = (await session.execute(q)).scalars().all()
    return [_bottleneck_out(b) for b in rows]
