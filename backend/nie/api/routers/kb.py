"""Knowledge-base upload endpoint."""
from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from nie.db.base import get_session
from nie.db.models import KBDocument
from nie.schemas.narrative import KBDocumentOut

router = APIRouter(prefix="/api/kb", tags=["kb"])


@router.post("/upload", response_model=KBDocumentOut)
async def upload_kb(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    raw = await file.read()
    try:
        content = raw.decode("utf-8", errors="replace")
    except Exception:
        content = ""
    doc = KBDocument(
        filename=file.filename or f"upload-{uuid.uuid4().hex[:8]}",
        content=content,
        meta={"size": len(raw), "content_type": file.content_type},
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc
