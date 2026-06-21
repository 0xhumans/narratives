"""Dependency + interaction graph endpoint."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nie.db.base import get_session
from nie.db.models import Dependency, Interaction, Narrative
from nie.schemas.narrative import (
    DependencyEdge,
    DependencyNode,
    GraphData,
    InteractionEdge,
)

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=GraphData)
async def get_graph(
    narrative_id: uuid.UUID | None = None,
    include_interactions: bool = True,
    session: AsyncSession = Depends(get_session),
):
    narratives = (await session.execute(select(Narrative))).scalars().all()
    nodes = [
        DependencyNode(id=n.id, slug=n.slug, name=n.name, kind=n.kind.value)
        for n in narratives
    ]
    by_id = {n.id: n for n in narratives}

    dep_q = select(Dependency)
    if narrative_id:
        dep_q = dep_q.where(Dependency.narrative_id == narrative_id)
    deps = (await session.execute(dep_q)).scalars().all()
    dep_edges = [
        DependencyEdge(
            source=d.narrative_id,
            target=d.depends_on_narrative_id,
            layer=d.layer,
            type=d.type.value,
            weight=d.weight,
            description=d.description,
        )
        for d in deps
        if d.narrative_id in by_id
    ]

    inter_edges: list[InteractionEdge] = []
    if include_interactions:
        inter_q = select(Interaction)
        if narrative_id:
            inter_q = inter_q.where(
                (Interaction.narrative_a_id == narrative_id)
                | (Interaction.narrative_b_id == narrative_id)
            )
        inters = (await session.execute(inter_q)).scalars().all()
        inter_edges = [
            InteractionEdge(
                source=i.narrative_a_id,
                target=i.narrative_b_id,
                kind=i.kind.value,
                description=i.description,
                strength=i.strength,
            )
            for i in inters
        ]

    return GraphData(nodes=nodes, dependency_edges=dep_edges, interaction_edges=inter_edges)
