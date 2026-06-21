"""Pydantic schemas for narratives, dependencies, interactions, bottlenecks, etc."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Narrative ---------------------------------------------------------------
class NarrativeBrief(ORMBase):
    id: uuid.UUID
    slug: str
    name: str
    kind: Literal["mega", "sub"]
    parent_id: uuid.UUID | None = None
    summary: str | None = None


class NarrativeDetail(NarrativeBrief):
    key_drivers: list[Any] = Field(default_factory=list)
    adoption_curve: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    children: list[NarrativeBrief] = Field(default_factory=list)


# --- Dependency graph --------------------------------------------------------
class DependencyNode(ORMBase):
    id: uuid.UUID
    slug: str
    name: str
    kind: str


class DependencyEdge(ORMBase):
    source: uuid.UUID
    target: uuid.UUID | None
    layer: str
    type: str
    weight: float
    description: str | None = None


class InteractionEdge(ORMBase):
    source: uuid.UUID
    target: uuid.UUID
    kind: str
    description: str | None = None
    strength: float


class GraphData(BaseModel):
    nodes: list[DependencyNode]
    dependency_edges: list[DependencyEdge]
    interaction_edges: list[InteractionEdge]


# --- Bottleneck --------------------------------------------------------------
class BottleneckOut(ORMBase):
    id: uuid.UUID
    narrative_id: uuid.UUID
    narrative_name: str = ""
    narrative_slug: str = ""
    mega_name: str = ""
    tier: Literal["current", "emerging", "hidden"]
    name: str
    cause: str | None = None
    severity: float
    time_horizon: str | None = None
    market_awareness: str | None = None
    winners: list[Any] = Field(default_factory=list)
    losers: list[Any] = Field(default_factory=list)


# --- Opportunity -------------------------------------------------------------
class OpportunityOut(ORMBase):
    id: uuid.UUID
    narrative_id: uuid.UUID
    title: str
    thesis: str | None = None
    type: Literal["direct", "contrarian"]
    awareness_gap: str | None = None
    valuation_note: str | None = None
    potential_winners: list[Any] = Field(default_factory=list)
    potential_losers: list[Any] = Field(default_factory=list)


# --- Score -------------------------------------------------------------------
class ScoreOut(ORMBase):
    narrative_id: uuid.UUID | None = None
    opportunity_id: uuid.UUID | None = None
    narrative_strength: float
    adoption_probability: float
    economic_impact: float
    bottleneck_advantage: float
    competitive_advantage: float
    valuation_support: float
    market_awareness_gap: float
    second_order_effects: float
    duration: float
    conviction: float
    composite: float


class HeatmapCell(BaseModel):
    narrative_id: uuid.UUID
    slug: str
    name: str
    scores: dict[str, float]
    composite: float


class HeatmapData(BaseModel):
    factors: list[str]
    rows: list[HeatmapCell]


class MegaColumn(BaseModel):
    narrative_id: uuid.UUID
    slug: str
    name: str


class CompanyHeatmapRow(BaseModel):
    company: str
    company_key: str
    ticker: str | None = None
    scores: dict[str, float]
    narrative_count: int
    mega_count: int = 0
    opportunity_count: int
    composite: float
    weighted_score: float = 0.0
    rank: int | None = None
    megas: list[str] = Field(default_factory=list)


class CompanyHeatmapData(BaseModel):
    columns: list[MegaColumn]
    rows: list[CompanyHeatmapRow]


class LifecyclePhase(BaseModel):
    id: str
    label: str
    subtitle: str
    order: int


class LifecycleNarrativeItem(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    kind: Literal["mega", "sub"]
    mega_name: str
    phase_id: str
    stage_raw: str | None = None
    composite: float
    penetration_pct: float | None = None
    is_leader: bool = False


class LifecycleMapData(BaseModel):
    phases: list[LifecyclePhase]
    narratives: list[LifecycleNarrativeItem]


# --- Report ------------------------------------------------------------------
class ReportOut(ORMBase):
    id: uuid.UUID
    narrative_id: uuid.UUID
    version: int
    generated_at: datetime
    payload: dict[str, Any]


# --- Job ---------------------------------------------------------------------
class JobOut(ORMBase):
    id: str
    status: str
    total: int
    done: int
    current: str | None = None
    error: str | None = None
    started_at: datetime
    finished_at: datetime | None = None


# --- KB ----------------------------------------------------------------------
class KBDocumentOut(ORMBase):
    id: uuid.UUID
    filename: str
    created_at: datetime
