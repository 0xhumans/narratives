"""Export all public app data to frontend/public/data for static/Vercel deployment."""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from nie.api.routers.bottlenecks import _bottleneck_out
from nie.api.routers.graph import get_graph
from nie.api.routers.opportunities import FACTOR_KEYS, heatmap as heatmap_endpoint
from nie.db.base import SessionLocal
from nie.db.models import Bottleneck, Narrative, Opportunity, Report
from nie.schemas.narrative import NarrativeBrief, NarrativeDetail, ReportOut
from nie.services.company_heatmap import build_company_heatmap
from nie.services.lifecycle import build_lifecycle_map

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "frontend" / "public" / "data"


def _write(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


async def export_all() -> dict[str, int]:
    counts: dict[str, int] = {}
    async with SessionLocal() as session:
        narratives = (await session.execute(select(Narrative).order_by(Narrative.name))).scalars().all()
        briefs = [NarrativeBrief.model_validate(n).model_dump(mode="json") for n in narratives]
        _write(OUT_DIR / "narratives.json", briefs)
        counts["narratives"] = len(briefs)

        lifecycle = await build_lifecycle_map(session)
        _write(OUT_DIR / "lifecycle-map.json", lifecycle.model_dump(mode="json"))

        bottlenecks = (
            await session.execute(
                select(Bottleneck).options(
                    selectinload(Bottleneck.narrative).selectinload(Narrative.parent)
                )
            )
        ).scalars().all()
        bottleneck_rows = [_bottleneck_out(b).model_dump(mode="json") for b in bottlenecks]
        _write(OUT_DIR / "bottlenecks.json", bottleneck_rows)
        counts["bottlenecks"] = len(bottleneck_rows)

        opportunities = (await session.execute(select(Opportunity).order_by(Opportunity.title))).scalars().all()
        opp_rows = [
            {
                "id": str(o.id),
                "narrative_id": str(o.narrative_id),
                "title": o.title,
                "thesis": o.thesis,
                "type": o.type.value if hasattr(o.type, "value") else o.type,
                "awareness_gap": o.awareness_gap,
                "valuation_note": o.valuation_note,
                "potential_winners": o.potential_winners or [],
                "potential_losers": o.potential_losers or [],
            }
            for o in opportunities
        ]
        _write(OUT_DIR / "opportunities.json", opp_rows)
        counts["opportunities"] = len(opp_rows)

        heatmap_data = await heatmap_endpoint(session)
        _write(OUT_DIR / "heatmap.json", heatmap_data.model_dump(mode="json"))
        counts["heatmap_rows"] = len(heatmap_data.rows)

        company_data = await build_company_heatmap(session)
        _write(OUT_DIR / "company-heatmap.json", company_data.model_dump(mode="json"))
        counts["company_rows"] = len(company_data.rows)

        graph_data = await get_graph(narrative_id=None, include_interactions=True, session=session)
        _write(OUT_DIR / "graph.json", graph_data.model_dump(mode="json"))

        detail_count = 0
        report_count = 0
        for n in narratives:
            detail_q = (
                select(Narrative)
                .options(selectinload(Narrative.children))
                .where(Narrative.id == n.id)
            )
            row = (await session.execute(detail_q)).scalar_one()
            detail = NarrativeDetail.model_validate(row).model_dump(mode="json")
            _write(OUT_DIR / "narratives" / f"{n.slug}.json", detail)
            detail_count += 1

            report = (
                await session.execute(
                    select(Report)
                    .where(Report.narrative_id == n.id)
                    .order_by(Report.version.desc())
                    .limit(1)
                )
            ).scalar_one_or_none()
            if report:
                out = ReportOut.model_validate(report).model_dump(mode="json")
                _write(OUT_DIR / "reports" / f"{n.slug}.json", out)
                report_count += 1

        counts["narrative_details"] = detail_count
        counts["reports"] = report_count

    manifest = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "factors": FACTOR_KEYS,
        "counts": counts,
    }
    _write(OUT_DIR / "manifest.json", manifest)
    return counts


def main() -> None:
    if not OUT_DIR.parent.exists():
        print(f"ERROR: frontend/public not found at {OUT_DIR.parent}", file=sys.stderr)
        raise SystemExit(1)
    counts = asyncio.run(export_all())
    print(f"Exported to {OUT_DIR}")
    for key, val in counts.items():
        print(f"  {key}: {val}")


if __name__ == "__main__":
    main()
