"""Pipeline trigger + status endpoints."""
from __future__ import annotations

import asyncio
import logging
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nie.db.base import SessionLocal, get_session
from nie.db.models import Job
from nie.config import settings
from nie.pipeline.report_builder import synthesize_all
from nie.schemas.narrative import JobOut

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])
log = logging.getLogger(__name__)

_pipeline_task: asyncio.Task | None = None


async def _run_pipeline(job_id: str) -> None:
    try:
        await synthesize_all(SessionLocal, job_id=job_id)
    except Exception:
        log.exception("Pipeline job %s failed", job_id)
        async with SessionLocal() as session:
            job = await session.get(Job, job_id)
            if job:
                job.status = "error"
                job.finished_at = datetime.utcnow()
                await session.commit()


@router.post("/run", response_model=JobOut)
async def run_pipeline():
    if not settings.pipeline_enabled:
        raise HTTPException(
            status_code=403,
            detail="Pipeline runs are disabled on this server. Run synthesis locally.",
        )
    global _pipeline_task

    if _pipeline_task is not None and not _pipeline_task.done():
        raise HTTPException(status_code=409, detail="Pipeline already running")

    # Also check DB for stale running jobs from prior server instances
    async with SessionLocal() as session:
        running = (
            await session.execute(
                select(Job).where(Job.status.in_(["pending", "running"])).limit(1)
            )
        ).scalar_one_or_none()
        if running:
            raise HTTPException(
                status_code=409,
                detail=f"Pipeline job {running.id} is already {running.status}",
            )

    job_id = secrets.token_hex(12)

    async with SessionLocal() as session:
        job = Job(id=job_id, status="pending", total=0, done=0, started_at=datetime.utcnow())
        session.add(job)
        await session.commit()

    _pipeline_task = asyncio.create_task(_run_pipeline(job_id))

    return JobOut(id=job_id, status="pending", total=0, done=0, started_at=datetime.utcnow())


@router.get("/status/{job_id}", response_model=JobOut)
async def status(job_id: str, session: AsyncSession = Depends(get_session)):
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
