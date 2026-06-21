"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-18
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "narratives",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(160), unique=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("kind", sa.Enum("mega", "sub", name="narrativekind"), nullable=False, server_default="mega"),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("key_drivers", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("adoption_curve", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_narratives_kind", "narratives", ["kind"])
    op.create_index("ix_narratives_parent_id", "narratives", ["parent_id"])

    op.create_table(
        "dependencies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("depends_on_narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=True),
        sa.Column("layer", sa.String(160), nullable=False),
        sa.Column("type", sa.Enum("input", "constraint", "resource", name="dependencytype"), nullable=False, server_default="input"),
        sa.Column("weight", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("description", sa.Text(), nullable=True),
    )
    op.create_index("ix_dependencies_narrative_id", "dependencies", ["narrative_id"])

    op.create_table(
        "interactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_a_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("narrative_b_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.Enum("reinforcing", "suppressing", "resource_competition", name="interactionkind"), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("strength", sa.Float(), nullable=False, server_default="1.0"),
        sa.UniqueConstraint("narrative_a_id", "narrative_b_id", "kind", name="uq_interaction_triple"),
    )
    op.create_index("ix_interactions_narrative_a_id", "interactions", ["narrative_a_id"])
    op.create_index("ix_interactions_narrative_b_id", "interactions", ["narrative_b_id"])

    op.create_table(
        "bottlenecks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tier", sa.Enum("current", "emerging", "hidden", name="bottlenecktier"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("cause", sa.Text(), nullable=True),
        sa.Column("severity", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("time_horizon", sa.String(200), nullable=True),
        sa.Column("market_awareness", sa.String(300), nullable=True),
        sa.Column("winners", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("losers", postgresql.JSONB, nullable=False, server_default="[]"),
    )
    op.create_index("ix_bottlenecks_narrative_id", "bottlenecks", ["narrative_id"])
    op.create_index("ix_bottlenecks_tier", "bottlenecks", ["tier"])

    op.create_table(
        "value_layers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("layer_name", sa.String(200), nullable=False),
        sa.Column("revenue_growth", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("pricing_power", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("competitive_intensity", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("capital_intensity", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("barriers_to_entry", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("roic", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("role", sa.Enum("creator", "capturer", name="valuerole"), nullable=False, server_default="capturer"),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_value_layers_narrative_id", "value_layers", ["narrative_id"])

    op.create_table(
        "psychology",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("consensus_view", sa.Text(), nullable=True),
        sa.Column("hidden_assumptions", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("narrative_risks", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("biases", postgresql.JSONB, nullable=False, server_default="[]"),
    )

    op.create_table(
        "foresight",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("success_conditions", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("failure_conditions", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("new_bottlenecks", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("scarcity", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("abundance", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("transformed_industries", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("disrupted_industries", postgresql.JSONB, nullable=False, server_default="[]"),
    )

    op.create_table(
        "effects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order", sa.String(20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
    )
    op.create_index("ix_effects_narrative_id", "effects", ["narrative_id"])
    op.create_index("ix_effects_order", "effects", ["order"])

    op.create_table(
        "regulatory",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("key_risks", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("catalysts", postgresql.JSONB, nullable=False, server_default="[]"),
    )

    op.create_table(
        "geopolitical",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("key_risks", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("opportunities", postgresql.JSONB, nullable=False, server_default="[]"),
    )

    op.create_table(
        "opportunities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("thesis", sa.Text(), nullable=True),
        sa.Column("type", sa.Enum("direct", "contrarian", name="opportunitytype"), nullable=False, server_default="direct"),
        sa.Column("awareness_gap", sa.Text(), nullable=True),
        sa.Column("valuation_note", sa.Text(), nullable=True),
        sa.Column("potential_winners", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("potential_losers", postgresql.JSONB, nullable=False, server_default="[]"),
    )
    op.create_index("ix_opportunities_narrative_id", "opportunities", ["narrative_id"])
    op.create_index("ix_opportunities_type", "opportunities", ["type"])

    op.create_table(
        "scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=True),
        sa.Column("opportunity_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=True),
        sa.Column("narrative_strength", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("adoption_probability", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("economic_impact", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("bottleneck_advantage", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("competitive_advantage", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("valuation_support", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("market_awareness_gap", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("second_order_effects", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("duration", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("conviction", sa.Float(), nullable=False, server_default="5.0"),
        sa.Column("composite", sa.Float(), nullable=False, server_default="5.0"),
    )
    op.create_index("ix_scores_narrative_id", "scores", ["narrative_id"])
    op.create_index("ix_scores_opportunity_id", "scores", ["opportunity_id"])

    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("narrative_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("narratives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("payload", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reports_narrative_id", "reports", ["narrative_id"])

    op.create_table(
        "jobs",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("done", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("current", sa.String(200), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "kb_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("filename", sa.String(300), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("meta", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    for table in (
        "kb_documents", "jobs", "reports", "scores", "opportunities",
        "geopolitical", "regulatory", "effects", "foresight", "psychology",
        "value_layers", "bottlenecks", "interactions", "dependencies",
        "narratives",
    ):
        op.drop_table(table)
    for enum_name in (
        "narrativekind", "dependencytype", "interactionkind", "bottlenecktier",
        "valuerole", "opportunitytype",
    ):
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
