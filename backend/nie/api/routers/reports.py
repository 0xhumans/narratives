"""Report endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nie.db.base import get_session
from nie.db.models import Narrative, Report
from nie.schemas.narrative import ReportOut

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{slug}", response_model=ReportOut)
async def get_latest_report(slug: str, session: AsyncSession = Depends(get_session)):
    narrative = (
        await session.execute(select(Narrative).where(Narrative.slug == slug))
    ).scalar_one_or_none()
    if not narrative:
        raise HTTPException(status_code=404, detail="Narrative not found")
    report = (
        await session.execute(
            select(Report)
            .where(Report.narrative_id == narrative.id)
            .order_by(Report.version.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="No report generated yet")
    return report
