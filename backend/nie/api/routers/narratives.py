"""Narrative CRUD + list endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nie.db.base import get_session
from nie.db.models import Narrative, NarrativeKind
from nie.schemas.narrative import LifecycleMapData, NarrativeBrief, NarrativeDetail
from nie.services.lifecycle import build_lifecycle_map

router = APIRouter(prefix="/api/narratives", tags=["narratives"])


@router.get("", response_model=list[NarrativeBrief])
async def list_narratives(
    kind: NarrativeKind | None = None,
    parent_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    q = select(Narrative)
    if kind:
        q = q.where(Narrative.kind == kind)
    if parent_id:
        q = q.where(Narrative.parent_id == parent_id)
    q = q.order_by(Narrative.name)
    rows = (await session.execute(q)).scalars().all()
    return rows


@router.get("/lifecycle/map", response_model=LifecycleMapData)
async def lifecycle_map(session: AsyncSession = Depends(get_session)):
    """Narratives grouped by adoption lifecycle phase with composite scores."""
    return await build_lifecycle_map(session)


@router.get("/{slug}", response_model=NarrativeDetail)
async def get_narrative(slug: str, session: AsyncSession = Depends(get_session)):
    q = (
        select(Narrative)
        .options(selectinload(Narrative.children))
        .where(Narrative.slug == slug)
    )
    row = (await session.execute(q)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Narrative not found")
    return row
