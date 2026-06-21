"""SQLAlchemy ORM models for the Narrative Intelligence Engine."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from nie.db.base import Base


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


class NarrativeKind(str, enum.Enum):
    mega = "mega"
    sub = "sub"


class DependencyType(str, enum.Enum):
    input = "input"
    constraint = "constraint"
    resource = "resource"


class InteractionKind(str, enum.Enum):
    reinforcing = "reinforcing"
    suppressing = "suppressing"
    resource_competition = "resource_competition"


class BottleneckTier(str, enum.Enum):
    current = "current"
    emerging = "emerging"
    hidden = "hidden"


class ValueRole(str, enum.Enum):
    creator = "creator"
    capturer = "capturer"


class EffectOrder(str, enum.Enum):
    first = "1"
    second = "2"
    third = "3"
    hidden = "hidden"


def _normalize_effect_order(value: str) -> str:
    """Normalize LLM-returned effect order labels to DB values."""
    v = (value or "").strip().lower()
    mapping = {
        "1": "1", "first": "1", "first-order": "1", "1st": "1",
        "2": "2", "second": "2", "second-order": "2", "2nd": "2",
        "3": "3", "third": "3", "third-order": "3", "3rd": "3",
        "hidden": "hidden",
    }
    return mapping.get(v, "1")


class OpportunityType(str, enum.Enum):
    direct = "direct"
    contrarian = "contrarian"


class Narrative(Base):
    __tablename__ = "narratives"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    kind: Mapped[NarrativeKind] = mapped_column(Enum(NarrativeKind), default=NarrativeKind.mega, index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), nullable=True, index=True
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_drivers: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    adoption_curve: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    parent: Mapped[Narrative | None] = relationship(
        "Narrative", remote_side="Narrative.id", back_populates="children"
    )
    children: Mapped[list[Narrative]] = relationship(
        "Narrative", back_populates="parent", cascade="all, delete-orphan"
    )
    dependencies: Mapped[list[Dependency]] = relationship(
        back_populates="narrative",
        foreign_keys="Dependency.narrative_id",
        cascade="all, delete-orphan",
    )
    interactions_a: Mapped[list[Interaction]] = relationship(
        foreign_keys="Interaction.narrative_a_id",
        back_populates="narrative_a",
        cascade="all, delete-orphan",
    )
    interactions_b: Mapped[list[Interaction]] = relationship(
        foreign_keys="Interaction.narrative_b_id",
        back_populates="narrative_b",
        cascade="all, delete-orphan",
    )
    bottlenecks: Mapped[list[Bottleneck]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    value_layers: Mapped[list[ValueLayer]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    psychology: Mapped[list[Psychology]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    foresight: Mapped[list[Foresight]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    effects: Mapped[list[Effect]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    regulatory: Mapped[list[Regulatory]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    geopolitical: Mapped[list[Geopolitical]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    opportunities: Mapped[list[Opportunity]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    scores: Mapped[list[Score]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )
    reports: Mapped[list[Report]] = relationship(
        back_populates="narrative", cascade="all, delete-orphan"
    )


class Dependency(Base):
    __tablename__ = "dependencies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    depends_on_narrative_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), nullable=True
    )
    layer: Mapped[str] = mapped_column(String(160))
    type: Mapped[DependencyType] = mapped_column(Enum(DependencyType), default=DependencyType.input)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    narrative: Mapped[Narrative] = relationship(
        back_populates="dependencies", foreign_keys=[narrative_id]
    )


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    narrative_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[InteractionKind] = mapped_column(Enum(InteractionKind))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    strength: Mapped[float] = mapped_column(Float, default=1.0)

    narrative_a: Mapped[Narrative] = relationship(
        back_populates="interactions_a", foreign_keys=[narrative_a_id]
    )
    narrative_b: Mapped[Narrative] = relationship(
        back_populates="interactions_b", foreign_keys=[narrative_b_id]
    )

    __table_args__ = (UniqueConstraint("narrative_a_id", "narrative_b_id", "kind", name="uq_interaction_triple"),)


class Bottleneck(Base):
    __tablename__ = "bottlenecks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    tier: Mapped[BottleneckTier] = mapped_column(Enum(BottleneckTier), index=True)
    name: Mapped[str] = mapped_column(String(200))
    cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[float] = mapped_column(Float, default=5.0)
    time_horizon: Mapped[str | None] = mapped_column(String(200), nullable=True)
    market_awareness: Mapped[str | None] = mapped_column(Text, nullable=True)
    winners: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    losers: Mapped[list[Any]] = mapped_column(JSONB, default=list)

    narrative: Mapped[Narrative] = relationship(back_populates="bottlenecks")


class ValueLayer(Base):
    __tablename__ = "value_layers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    layer_name: Mapped[str] = mapped_column(String(200))
    revenue_growth: Mapped[float] = mapped_column(Float, default=5.0)
    pricing_power: Mapped[float] = mapped_column(Float, default=5.0)
    competitive_intensity: Mapped[float] = mapped_column(Float, default=5.0)
    capital_intensity: Mapped[float] = mapped_column(Float, default=5.0)
    barriers_to_entry: Mapped[float] = mapped_column(Float, default=5.0)
    roic: Mapped[float] = mapped_column(Float, default=5.0)
    role: Mapped[ValueRole] = mapped_column(Enum(ValueRole), default=ValueRole.capturer)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    narrative: Mapped[Narrative] = relationship(back_populates="value_layers")


class Psychology(Base):
    __tablename__ = "psychology"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True, unique=True
    )
    consensus_view: Mapped[str | None] = mapped_column(Text, nullable=True)
    hidden_assumptions: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    narrative_risks: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    biases: Mapped[list[Any]] = mapped_column(JSONB, default=list)

    narrative: Mapped[Narrative] = relationship(back_populates="psychology")


class Foresight(Base):
    __tablename__ = "foresight"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True, unique=True
    )
    success_conditions: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    failure_conditions: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    new_bottlenecks: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    scarcity: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    abundance: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    transformed_industries: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    disrupted_industries: Mapped[list[Any]] = mapped_column(JSONB, default=list)

    narrative: Mapped[Narrative] = relationship(back_populates="foresight")


class Effect(Base):
    __tablename__ = "effects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[str] = mapped_column(String(20), index=True)
    description: Mapped[str] = mapped_column(Text)

    narrative: Mapped[Narrative] = relationship(back_populates="effects")


class Regulatory(Base):
    __tablename__ = "regulatory"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True, unique=True
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_risks: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    catalysts: Mapped[list[Any]] = mapped_column(JSONB, default=list)

    narrative: Mapped[Narrative] = relationship(back_populates="regulatory")


class Geopolitical(Base):
    __tablename__ = "geopolitical"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True, unique=True
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_risks: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    opportunities: Mapped[list[Any]] = mapped_column(JSONB, default=list)

    narrative: Mapped[Narrative] = relationship(back_populates="geopolitical")


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    thesis: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[OpportunityType] = mapped_column(
        Enum(OpportunityType), default=OpportunityType.direct, index=True
    )
    awareness_gap: Mapped[str | None] = mapped_column(Text, nullable=True)
    valuation_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    potential_winners: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    potential_losers: Mapped[list[Any]] = mapped_column(JSONB, default=list)

    narrative: Mapped[Narrative] = relationship(back_populates="opportunities")
    scores: Mapped[list[Score]] = relationship(back_populates="opportunity", cascade="all, delete-orphan")


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), nullable=True, index=True
    )
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=True, index=True
    )
    narrative_strength: Mapped[float] = mapped_column(Float, default=5.0)
    adoption_probability: Mapped[float] = mapped_column(Float, default=5.0)
    economic_impact: Mapped[float] = mapped_column(Float, default=5.0)
    bottleneck_advantage: Mapped[float] = mapped_column(Float, default=5.0)
    competitive_advantage: Mapped[float] = mapped_column(Float, default=5.0)
    valuation_support: Mapped[float] = mapped_column(Float, default=5.0)
    market_awareness_gap: Mapped[float] = mapped_column(Float, default=5.0)
    second_order_effects: Mapped[float] = mapped_column(Float, default=5.0)
    duration: Mapped[float] = mapped_column(Float, default=5.0)
    conviction: Mapped[float] = mapped_column(Float, default=5.0)
    composite: Mapped[float] = mapped_column(Float, default=5.0)

    narrative: Mapped[Narrative | None] = relationship(back_populates="scores")
    opportunity: Mapped[Opportunity | None] = relationship(back_populates="scores")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    narrative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("narratives.id", ondelete="CASCADE"), index=True
    )
    version: Mapped[int] = mapped_column(Integer, default=1)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    narrative: Mapped[Narrative] = relationship(back_populates="reports")


class Job(Base):
    """Tracks async pipeline runs."""

    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|running|done|error
    total: Mapped[int] = mapped_column(Integer, default=0)
    done: Mapped[int] = mapped_column(Integer, default=0)
    current: Mapped[str | None] = mapped_column(String(200), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class KBDocument(Base):
    """User-provided knowledge-base documents."""

    __tablename__ = "kb_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    filename: Mapped[str] = mapped_column(String(300))
    content: Mapped[str] = mapped_column(Text)
    meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
