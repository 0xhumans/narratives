"""Re-synthesize a single narrative by slug."""
from __future__ import annotations

import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from nie.db.base import SessionLocal
from nie.db.models import Narrative
from nie.pipeline.report_builder import _narrative_to_work, _slug_to_narrative_map, synthesize_one


async def main(slug: str) -> None:
    async with SessionLocal() as session:
        rows = (
            await session.execute(select(Narrative).options(selectinload(Narrative.parent)))
        ).scalars().all()
        slug_map = _slug_to_narrative_map(rows)
        narrative = next((n for n in rows if n.slug == slug), None)
        if narrative is None:
            raise SystemExit(f"Unknown slug: {slug}")
        work = _narrative_to_work(narrative)

    payload = await synthesize_one(SessionLocal, work, slug_map)
    winners = payload.get("potential_winners") or []
    losers = payload.get("potential_losers") or []
    print(f"Done: {slug}")
    print(f"Winners: {len(winners)}, Losers: {len(losers)}")
    if payload.get("executive_summary"):
        print("Summary:", str(payload["executive_summary"])[:200], "...")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "spiking-neural-networks"
    asyncio.run(main(target))
