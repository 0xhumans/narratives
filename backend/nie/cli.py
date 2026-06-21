"""CLI: `python -m nie.cli seed|run|serve`."""
from __future__ import annotations

import asyncio

import typer
from rich.console import Console
from sqlalchemy import select

from nie.db.base import SessionLocal
from nie.db.models import Narrative, NarrativeKind
from nie.pipeline.catalog import all_narrative_specs
from nie.pipeline.report_builder import synthesize_all

app = typer.Typer(add_completion=False, help="Narrative Intelligence Engine CLI")
console = Console()


@app.command()
def seed() -> None:
    """Seed the narratives catalog into the database."""
    asyncio.run(_seed())


async def _seed() -> None:
    async with SessionLocal() as session:
        existing = {n.slug: n for n in (await session.execute(select(Narrative))).scalars().all()}
        # First pass: mega narratives
        for name, slug, parent_slug in all_narrative_specs():
            if parent_slug is None and slug not in existing:
                n = Narrative(name=name, slug=slug, kind=NarrativeKind.mega, parent_id=None)
                session.add(n)
        await session.flush()
        existing = {n.slug: n for n in (await session.execute(select(Narrative))).scalars().all()}
        # Second pass: sub-narratives
        for name, slug, parent_slug in all_narrative_specs():
            if parent_slug and slug not in existing:
                parent = existing.get(parent_slug)
                n = Narrative(
                    name=name,
                    slug=slug,
                    kind=NarrativeKind.sub,
                    parent_id=parent.id if parent else None,
                )
                session.add(n)
        await session.commit()
        total = (await session.execute(select(Narrative))).scalars().all()
        console.print(f"[green]Seeded {len(total)} narratives.[/green]")


@app.command()
def run() -> None:
    """Run the full synthesis pipeline for all narratives."""
    asyncio.run(synthesize_all(SessionLocal))


@app.command()
def serve(
    host: str = "127.0.0.1",
    port: int = 8000,
    reload: bool = True,
) -> None:
    """Run the FastAPI server via uvicorn."""
    import uvicorn

    uvicorn.run("nie.api.main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    app()
