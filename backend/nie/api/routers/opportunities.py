"""Opportunity + scoring endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nie.db.base import get_session
from nie.db.models import Narrative, Opportunity, OpportunityType, Score
from nie.schemas.narrative import (
    CompanyHeatmapData,
    HeatmapCell,
    HeatmapData,
    OpportunityOut,
    ScoreOut,
)
from nie.services.company_heatmap import build_company_heatmap

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


@router.get("", response_model=list[OpportunityOut])
async def list_opportunities(
    contrarian: bool | None = None,
    session: AsyncSession = Depends(get_session),
):
    q = select(Opportunity).order_by(Opportunity.title)
    if contrarian:
        q = q.where(Opportunity.type == OpportunityType.contrarian)
    return (await session.execute(q)).scalars().all()


FACTOR_KEYS = [
    "narrative_strength",
    "adoption_probability",
    "economic_impact",
    "bottleneck_advantage",
    "competitive_advantage",
    "valuation_support",
    "market_awareness_gap",
    "second_order_effects",
    "duration",
    "conviction",
]


@router.get("/heatmap", response_model=HeatmapData)
async def heatmap(session: AsyncSession = Depends(get_session)):
    rows = (
        await session.execute(
            select(Narrative, Score)
            .join(Score, Score.narrative_id == Narrative.id)
            .where(Score.opportunity_id.is_(None))
            .order_by(Narrative.name)
        )
    ).all()
    cells: list[HeatmapCell] = []
    for n, s in rows:
        cells.append(
            HeatmapCell(
                narrative_id=n.id,
                slug=n.slug,
                name=n.name,
                scores={k: float(getattr(s, k)) for k in FACTOR_KEYS},
                composite=s.composite,
            )
        )
    return HeatmapData(factors=FACTOR_KEYS, rows=cells)


@router.get("/company-heatmap", response_model=CompanyHeatmapData)
async def company_heatmap(session: AsyncSession = Depends(get_session)):
    """Cross-narrative heatmap of companies cited as opportunity winners."""
    return await build_company_heatmap(session)
