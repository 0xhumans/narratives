"""Structured prompts + intermediate Pydantic schemas for each pipeline stage."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Stage schemas (returned by GLM-5.2, validated before DB write)
# ============================================================================


class DiscoveryResult(BaseModel):
    summary: str = Field(..., description="2-3 paragraph narrative summary")
    key_drivers: list[str] = Field(default_factory=list)
    adoption_curve: dict[str, Any] = Field(
        default_factory=dict,
        description="Stage, penetration_pct, growth_rate, inflection_points[]",
    )


class DependencyItem(BaseModel):
    layer: str
    type: Literal["input", "constraint", "resource"]
    weight: float = 1.0
    description: str | None = None


class DependencyResult(BaseModel):
    dependencies: list[DependencyItem]


class InteractionItem(BaseModel):
    target_narrative: str
    kind: Literal["reinforcing", "suppressing", "resource_competition"]
    description: str
    strength: float = 1.0


class InteractionResult(BaseModel):
    interactions: list[InteractionItem]


class BottleneckItem(BaseModel):
    tier: Literal["current", "emerging", "hidden"]
    name: str
    cause: str | None = None
    severity: float = Field(..., ge=0, le=10)
    time_horizon: str | None = None
    market_awareness: str | None = None
    winners: list[str] = Field(default_factory=list)
    losers: list[str] = Field(default_factory=list)


class BottleneckResult(BaseModel):
    bottlenecks: list[BottleneckItem]


class ValueLayerItem(BaseModel):
    layer_name: str
    revenue_growth: float = Field(..., ge=0, le=10)
    pricing_power: float = Field(..., ge=0, le=10)
    competitive_intensity: float = Field(..., ge=0, le=10)
    capital_intensity: float = Field(..., ge=0, le=10)
    barriers_to_entry: float = Field(..., ge=0, le=10)
    roic: float = Field(..., ge=0, le=10)
    role: Literal["creator", "capturer"]
    notes: str | None = None


class ValueCaptureResult(BaseModel):
    layers: list[ValueLayerItem]


class PsychologyResult(BaseModel):
    consensus_view: str
    hidden_assumptions: list[str] = Field(default_factory=list)
    narrative_risks: list[str] = Field(default_factory=list)
    biases: list[str] = Field(default_factory=list)


class ForesightResult(BaseModel):
    success_conditions: list[str] = Field(default_factory=list)
    failure_conditions: list[str] = Field(default_factory=list)
    new_bottlenecks: list[str] = Field(default_factory=list)
    scarcity: list[str] = Field(default_factory=list)
    abundance: list[str] = Field(default_factory=list)
    transformed_industries: list[str] = Field(default_factory=list)
    disrupted_industries: list[str] = Field(default_factory=list)


class EffectItem(BaseModel):
    order: str = Field(..., description="One of: 1, 2, 3, hidden (or first/second/third)")
    description: str

    @field_validator("order")
    @classmethod
    def _normalize_order(cls, v: str) -> str:
        mapping = {
            "1": "1", "first": "1", "first-order": "1", "1st": "1",
            "2": "2", "second": "2", "second-order": "2", "2nd": "2",
            "3": "3", "third": "3", "third-order": "3", "3rd": "3",
            "hidden": "hidden",
        }
        return mapping.get(v.strip().lower(), v)


class EffectResult(BaseModel):
    effects: list[EffectItem]


class RegulatoryResult(BaseModel):
    summary: str
    key_risks: list[str] = Field(default_factory=list)
    catalysts: list[str] = Field(default_factory=list)


class GeopoliticalResult(BaseModel):
    summary: str
    key_risks: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)


class OpportunityItem(BaseModel):
    title: str
    thesis: str
    type: Literal["direct", "contrarian"]
    awareness_gap: str | None = None
    valuation_note: str | None = None
    potential_winners: list[str] = Field(default_factory=list)
    potential_losers: list[str] = Field(default_factory=list)


class OpportunityResult(BaseModel):
    opportunities: list[OpportunityItem]


class ScoreResult(BaseModel):
    narrative_strength: float = Field(..., ge=1, le=10)
    adoption_probability: float = Field(..., ge=1, le=10)
    economic_impact: float = Field(..., ge=1, le=10)
    bottleneck_advantage: float = Field(..., ge=1, le=10)
    competitive_advantage: float = Field(..., ge=1, le=10)
    valuation_support: float = Field(..., ge=1, le=10)
    market_awareness_gap: float = Field(..., ge=1, le=10)
    second_order_effects: float = Field(..., ge=1, le=10)
    duration: float = Field(..., ge=1, le=10)
    conviction: float = Field(..., ge=1, le=10)


# ============================================================================
# Prompts
# ============================================================================

SYSTEM_BASE = (
    "You are the Narrative Intelligence Engine, an expert analyst synthesizing "
    "investment narratives across finance, economics, technology, systems thinking, "
    "complexity science, psychology, sociology, geopolitics, innovation theory, and "
    "investment analysis. Think in systems, think in time, and reason beyond "
    "first-order effects. Be concrete, specific, and avoid platitudes."
)


def _ctx_block(context: dict[str, Any] | None) -> str:
    if not context:
        return ""
    parts: list[str] = []
    if context.get("news"):
        parts.append("Recent news headlines:\n- " + "\n- ".join(context["news"]))
    if context.get("market"):
        parts.append("Market context:\n" + json_safe_dumps(context["market"]))
    if context.get("kb"):
        parts.append("Knowledge-base excerpts:\n" + "\n---\n".join(context["kb"]))
    return ("\n\n").join(parts) + "\n\n" if parts else ""


def json_safe_dumps(obj: Any) -> str:
    import json

    return json.dumps(obj, ensure_ascii=False, default=str, indent=2)


def discovery_prompt(narrative_name: str, kind: str, parent: str | None, context: dict | None) -> str:
    return (
        f"Analyze the {kind} investment narrative: '{narrative_name}'"
        + (f" (a sub-narrative of '{parent}')" if parent else "")
        + ".\n"
        + _ctx_block(context)
        + "Produce a concise summary, 4-8 key drivers, and an adoption-curve "
        "characterization (current stage, estimated penetration %, growth rate, and "
        "2-4 inflection points)."
    )


def dependency_prompt(narrative_name: str, context: dict | None) -> str:
    return (
        f"For the investment narrative '{narrative_name}', construct its dependency "
        "network. List the concrete inputs, constraints, and resources it depends on "
        "(e.g. electricity, data centers, GPUs, memory, networking, cooling, water, "
        "construction, skilled labor, capital availability). Use weight 0-10 for "
        "criticality.\n"
        + _ctx_block(context)
    )


def interaction_prompt(narrative_name: str, all_narratives: list[str]) -> str:
    others = ", ".join(n for n in all_narratives if n != narrative_name)
    return (
        f"For the narrative '{narrative_name}', analyze how it interacts with the other "
        f"mega narratives: {others}. For each meaningful interaction, classify it as "
        "reinforcing, suppressing, or resource_competition, describe the mechanism, "
        "and rate strength 0-10. Only include interactions that are materially "
        "significant."
    )


def bottleneck_prompt(narrative_name: str, context: dict | None) -> str:
    return (
        f"Identify bottlenecks for the '{narrative_name}' narrative across three tiers: "
        "current (known to the market), emerging (likely within 1-5 years), and hidden "
        "(largely ignored by the market). For each, give cause, severity (0-10), time "
        "horizon, market awareness, and potential winners & losers. "
        "Each winner/loser must appear once only — format as "
        "'Entity — one-line reason they benefit or are hurt'.\n"
        + _ctx_block(context)
    )


def value_capture_prompt(narrative_name: str) -> str:
    return (
        f"For '{narrative_name}', determine where economic value is most likely to "
        "accumulate. Score each layer of the value chain (0-10) on revenue growth, "
        "pricing power, competitive intensity, capital intensity, barriers to entry, "
        "and ROIC. Classify each layer as a value creator or value capturer."
    )


def psychology_prompt(narrative_name: str) -> str:
    return (
        f"Analyze investor psychology around '{narrative_name}'. State the consensus "
        "view, the hidden assumptions embedded in market expectations, the narrative "
        "risks (which assumptions may prove incorrect), and the behavioral biases at "
        "play (recency, herd, overconfidence, narrative fallacy, availability, "
        "confirmation)."
    )


def foresight_prompt(narrative_name: str) -> str:
    return (
        f"For '{narrative_name}', provide strategic foresight: what must happen for "
        "success, what could prevent success, what new bottlenecks emerge if it "
        "succeeds, what becomes scarce, what becomes abundant, which industries are "
        "transformed, and which are disrupted."
    )


def effects_prompt(narrative_name: str) -> str:
    return (
        f"For '{narrative_name}', enumerate first-order, second-order, third-order, "
        "and hidden effects. First-order = direct consequences; second-order = "
        "consequences of consequences; third-order = systemic implications; hidden = "
        "impacts not immediately visible."
    )


def regulatory_prompt(narrative_name: str) -> str:
    return (
        f"Analyze the regulatory landscape for '{narrative_name}': summarize the "
        "current and likely future regulatory regime, list key risks, and list "
        "potential catalysts."
    )


def geopolitical_prompt(narrative_name: str) -> str:
    return (
        f"Analyze the geopolitical dimensions of '{narrative_name}': summarize the "
        "geopolitical dynamics, list key risks, and list geopolitical opportunities."
    )


def opportunity_prompt(narrative_name: str) -> str:
    return (
        f"Identify investment opportunities generated by '{narrative_name}' from "
        "narrative growth, narrative conflict, bottlenecks, resource scarcity, "
        "regulatory shifts, and market misperceptions. Include both 'direct' "
        "opportunities and 'contrarian' opportunities (high narrative importance, "
        "low market attention, reasonable valuation, strong competitive position). "
        "For each opportunity, list potential winners and losers — each entity once "
        "only across the full response, formatted as "
        "'Name — one-line reason they win or lose'."
    )


def scoring_prompt(narrative_name: str, level: str = "narrative") -> str:
    return (
        f"Score the {level} '{narrative_name}' from 1 to 10 across these factors: "
        "narrative_strength, adoption_probability, economic_impact, "
        "bottleneck_advantage, competitive_advantage, valuation_support, "
        "market_awareness_gap, second_order_effects, duration (of opportunity), "
        "and conviction. Be rigorous and specific."
    )
