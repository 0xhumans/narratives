"""Report builder: orchestrates all 12 pipeline stages for one narrative,
and runs all narratives in parallel via asyncio.gather."""
from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nie.config import settings
from nie.db.models import (
    Bottleneck,
    Dependency,
    DependencyType,
    Effect,
    Foresight,
    Geopolitical,
    Interaction,
    InteractionKind,
    Job,
    Narrative,
    NarrativeKind,
    Opportunity,
    OpportunityType,
    Psychology,
    Regulatory,
    Report,
    Score,
    ValueLayer,
    ValueRole,
    _normalize_effect_order,
)
from nie.datasources.kb import list_kb_excerpts
from nie.datasources.market import NARRATIVE_TICKERS, fetch_market
from nie.datasources.news import gather_context
from nie.llm.client import get_llm
from nie.llm.prompts import (
    SYSTEM_BASE,
    bottleneck_prompt,
    dependency_prompt,
    discovery_prompt,
    effects_prompt,
    foresight_prompt,
    geopolitical_prompt,
    interaction_prompt,
    opportunity_prompt,
    psychology_prompt,
    regulatory_prompt,
    scoring_prompt,
    value_capture_prompt,
    # stage schemas
    BottleneckResult,
    DependencyResult,
    DiscoveryResult,
    EffectResult,
    ForesightResult,
    GeopoliticalResult,
    InteractionResult,
    OpportunityResult,
    PsychologyResult,
    RegulatoryResult,
    ScoreResult,
    ValueCaptureResult,
)
from nie.pipeline.catalog import all_mega_names
from nie.services.entity_entries import aggregate_entity_entries

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class NarrativeWork:
    """Lightweight narrative snapshot for LLM stages (no DB session held)."""

    id: uuid.UUID
    name: str
    slug: str
    kind: NarrativeKind
    parent_name: str | None
    market_slug: str


def _slug_to_narrative_map(rows: list[Narrative]) -> dict[str, Narrative]:
    return {n.slug: n for n in rows}


def _narrative_to_work(n: Narrative) -> NarrativeWork:
    if n.slug in NARRATIVE_TICKERS:
        market_slug = n.slug
    elif n.kind == NarrativeKind.mega:
        market_slug = n.slug
    elif n.parent:
        market_slug = n.parent.slug
    else:
        market_slug = n.slug
    return NarrativeWork(
        id=n.id,
        name=n.name,
        slug=n.slug,
        kind=n.kind,
        parent_name=n.parent.name if n.parent else None,
        market_slug=market_slug,
    )


async def _build_context(session_factory, work: NarrativeWork) -> dict[str, Any]:
    async with session_factory() as session:
        kb_ctx = await list_kb_excerpts(session)
    news_ctx, market_ctx = await asyncio.gather(
        gather_context(work.name),
        fetch_market(work.market_slug),
    )
    ctx: dict[str, Any] = {}
    if news_ctx.get("news"):
        ctx["news"] = news_ctx["news"]
    if market_ctx:
        ctx["market"] = market_ctx
    if kb_ctx:
        ctx["kb"] = kb_ctx
    return ctx


async def _stage_discovery(work: NarrativeWork, context: dict[str, Any]) -> DiscoveryResult:
    return await get_llm().chat_json(
        SYSTEM_BASE,
        discovery_prompt(work.name, work.kind.value, work.parent_name, context),
        DiscoveryResult,
    )


async def _stage_dependencies(work: NarrativeWork, context: dict[str, Any]) -> DependencyResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, dependency_prompt(work.name, context), DependencyResult
    )


async def _stage_interactions(work: NarrativeWork) -> InteractionResult:
    return await get_llm().chat_json(
        SYSTEM_BASE,
        interaction_prompt(work.name, all_mega_names()),
        InteractionResult,
    )


async def _stage_bottlenecks(work: NarrativeWork, context: dict[str, Any]) -> BottleneckResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, bottleneck_prompt(work.name, context), BottleneckResult
    )


async def _stage_value(work: NarrativeWork) -> ValueCaptureResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, value_capture_prompt(work.name), ValueCaptureResult
    )


async def _stage_psychology(work: NarrativeWork) -> PsychologyResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, psychology_prompt(work.name), PsychologyResult
    )


async def _stage_foresight(work: NarrativeWork) -> ForesightResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, foresight_prompt(work.name), ForesightResult
    )


async def _stage_effects(work: NarrativeWork) -> EffectResult:
    return await get_llm().chat_json(SYSTEM_BASE, effects_prompt(work.name), EffectResult)


async def _stage_regulatory(work: NarrativeWork) -> RegulatoryResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, regulatory_prompt(work.name), RegulatoryResult
    )


async def _stage_geopolitical(work: NarrativeWork) -> GeopoliticalResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, geopolitical_prompt(work.name), GeopoliticalResult
    )


async def _stage_opportunities(work: NarrativeWork) -> OpportunityResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, opportunity_prompt(work.name), OpportunityResult
    )


async def _stage_score(work: NarrativeWork) -> ScoreResult:
    return await get_llm().chat_json(
        SYSTEM_BASE, scoring_prompt(work.name, "narrative"), ScoreResult
    )


async def _score_opportunities(work: NarrativeWork, opps: OpportunityResult) -> list[ScoreResult]:
    if not opps.opportunities:
        return []
    return list(
        await asyncio.gather(
            *[
                get_llm().chat_json(
                    SYSTEM_BASE,
                    scoring_prompt(o.title, "opportunity")
                    + f" within narrative '{work.name}'.",
                    ScoreResult,
                )
                for o in opps.opportunities
            ]
        )
    )


# --- Persistence -------------------------------------------------------------

async def _delete_cascade(session: AsyncSession, narrative_id: uuid.UUID) -> None:
    for model in (
        Dependency, Interaction, Bottleneck, ValueLayer, Psychology,
        Foresight, Effect, Regulatory, Geopolitical, Opportunity, Score, Report,
    ):
        col = "narrative_id"
        if model is Interaction:
            # delete both sides
            await session.execute(delete(Interaction).where(Interaction.narrative_a_id == narrative_id))
            await session.execute(delete(Interaction).where(Interaction.narrative_b_id == narrative_id))
            continue
        if model is Score:
            await session.execute(
                delete(Score).where(Score.narrative_id == narrative_id, Score.opportunity_id.is_(None))
            )
            continue
        await session.execute(delete(model).where(getattr(model, col) == narrative_id))


async def _persist(
    session: AsyncSession,
    narrative: Narrative,
    discovery: DiscoveryResult,
    deps: DependencyResult,
    inter: InteractionResult,
    bottlenecks: BottleneckResult,
    value: ValueCaptureResult,
    psych: PsychologyResult,
    foresight: ForesightResult,
    effects: EffectResult,
    reg: RegulatoryResult,
    geo: GeopoliticalResult,
    opps: OpportunityResult,
    score: ScoreResult,
    slug_map: dict[str, Narrative],
    opp_scores: list[ScoreResult],
) -> dict[str, Any]:
    await _delete_cascade(session, narrative.id)

    narrative.summary = discovery.summary
    narrative.key_drivers = discovery.key_drivers
    narrative.adoption_curve = discovery.adoption_curve

    # Dependencies (link to other narratives when layer matches a slug/name)
    for d in deps.dependencies:
        session.add(
            Dependency(
                narrative_id=narrative.id,
                depends_on_narrative_id=None,
                layer=d.layer,
                type=DependencyType(d.type),
                weight=d.weight,
                description=d.description,
            )
        )

    # Interactions
    for it in inter.interactions:
        target = slug_map.get(it.target_narrative.lower().replace(" ", "-"))
        if target is None:
            # try name match
            for s, n in slug_map.items():
                if n.name.lower() == it.target_narrative.lower():
                    target = n
                    break
        if target is None or target.id == narrative.id:
            continue
        session.add(
            Interaction(
                narrative_a_id=narrative.id,
                narrative_b_id=target.id,
                kind=InteractionKind(it.kind),
                description=it.description,
                strength=it.strength,
            )
        )

    # Bottlenecks
    for b in bottlenecks.bottlenecks:
        session.add(
            Bottleneck(
                narrative_id=narrative.id,
                tier=b.tier,
                name=b.name,
                cause=b.cause,
                severity=b.severity,
                time_horizon=b.time_horizon,
                market_awareness=b.market_awareness,
                winners=b.winners,
                losers=b.losers,
            )
        )

    # Value layers
    for v in value.layers:
        session.add(
            ValueLayer(
                narrative_id=narrative.id,
                layer_name=v.layer_name,
                revenue_growth=v.revenue_growth,
                pricing_power=v.pricing_power,
                competitive_intensity=v.competitive_intensity,
                capital_intensity=v.capital_intensity,
                barriers_to_entry=v.barriers_to_entry,
                roic=v.roic,
                role=ValueRole(v.role),
                notes=v.notes,
            )
        )

    # Psychology
    session.add(
        Psychology(
            narrative_id=narrative.id,
            consensus_view=psych.consensus_view,
            hidden_assumptions=psych.hidden_assumptions,
            narrative_risks=psych.narrative_risks,
            biases=psych.biases,
        )
    )

    # Foresight
    session.add(
        Foresight(
            narrative_id=narrative.id,
            success_conditions=foresight.success_conditions,
            failure_conditions=foresight.failure_conditions,
            new_bottlenecks=foresight.new_bottlenecks,
            scarcity=foresight.scarcity,
            abundance=foresight.abundance,
            transformed_industries=foresight.transformed_industries,
            disrupted_industries=foresight.disrupted_industries,
        )
    )

    # Effects
    for e in effects.effects:
        session.add(
            Effect(
                narrative_id=narrative.id,
                order=_normalize_effect_order(e.order),
                description=e.description,
            )
        )

    # Regulatory / Geopolitical
    session.add(
        Regulatory(
            narrative_id=narrative.id,
            summary=reg.summary,
            key_risks=reg.key_risks,
            catalysts=reg.catalysts,
        )
    )
    session.add(
        Geopolitical(
            narrative_id=narrative.id,
            summary=geo.summary,
            key_risks=geo.key_risks,
            opportunities=geo.opportunities,
        )
    )

    # Opportunities + pre-computed per-opportunity scores
    for o, opp_score in zip(opps.opportunities, opp_scores, strict=False):
        opp = Opportunity(
            narrative_id=narrative.id,
            title=o.title,
            thesis=o.thesis,
            type=OpportunityType(o.type),
            awareness_gap=o.awareness_gap,
            valuation_note=o.valuation_note,
            potential_winners=o.potential_winners,
            potential_losers=o.potential_losers,
        )
        session.add(opp)
        await session.flush()
        session.add(
            Score(
                opportunity_id=opp.id,
                narrative_id=None,
                narrative_strength=opp_score.narrative_strength,
                adoption_probability=opp_score.adoption_probability,
                economic_impact=opp_score.economic_impact,
                bottleneck_advantage=opp_score.bottleneck_advantage,
                competitive_advantage=opp_score.competitive_advantage,
                valuation_support=opp_score.valuation_support,
                market_awareness_gap=opp_score.market_awareness_gap,
                second_order_effects=opp_score.second_order_effects,
                duration=opp_score.duration,
                conviction=opp_score.conviction,
                composite=_composite(opp_score.model_dump()),
            )
        )

    # Narrative-level score
    weights = settings.score_weights
    composite = _composite(score.model_dump(), weights)
    session.add(
        Score(
            narrative_id=narrative.id,
            opportunity_id=None,
            narrative_strength=score.narrative_strength,
            adoption_probability=score.adoption_probability,
            economic_impact=score.economic_impact,
            bottleneck_advantage=score.bottleneck_advantage,
            competitive_advantage=score.competitive_advantage,
            valuation_support=score.valuation_support,
            market_awareness_gap=score.market_awareness_gap,
            second_order_effects=score.second_order_effects,
            duration=score.duration,
            conviction=score.conviction,
            composite=composite,
        )
    )

    payload = _build_report_payload(
        narrative, discovery, deps, inter, bottlenecks, value, psych,
        foresight, effects, reg, geo, opps, score, composite,
    )
    # version = max existing + 1
    existing = (
        await session.execute(
            select(Report).where(Report.narrative_id == narrative.id).order_by(Report.version.desc()).limit(1)
        )
    ).scalar_one_or_none()
    version = (existing.version + 1) if existing else 1
    report = Report(narrative_id=narrative.id, version=version, payload=payload)
    session.add(report)
    await session.flush()
    return payload


def _composite(scores: dict[str, Any], weights: dict[str, float] | None = None) -> float:
    weights = weights or settings.score_weights
    factors = [
        "narrative_strength", "adoption_probability", "economic_impact",
        "bottleneck_advantage", "competitive_advantage", "valuation_support",
        "market_awareness_gap", "second_order_effects", "duration", "conviction",
    ]
    total_w = sum(weights.get(f, 1.0) for f in factors)
    total = sum(scores.get(f, 5.0) * weights.get(f, 1.0) for f in factors)
    return round(total / total_w, 2) if total_w else 5.0


def _build_report_payload(
    narrative: Narrative,
    discovery: DiscoveryResult,
    deps: DependencyResult,
    inter: InteractionResult,
    bottlenecks: BottleneckResult,
    value: ValueCaptureResult,
    psych: PsychologyResult,
    foresight: ForesightResult,
    effects: EffectResult,
    reg: RegulatoryResult,
    geo: GeopoliticalResult,
    opps: OpportunityResult,
    score: ScoreResult,
    composite: float,
) -> dict[str, Any]:
    return {
        "narrative_summary": discovery.summary,
        "key_drivers": discovery.key_drivers,
        "adoption_curve_analysis": discovery.adoption_curve,
        "dependency_network": [d.model_dump() for d in deps.dependencies],
        "feedback_loops": [it.model_dump() for it in inter.interactions],
        "current_bottlenecks": [b.model_dump() for b in bottlenecks.bottlenecks if b.tier == "current"],
        "future_bottlenecks": [b.model_dump() for b in bottlenecks.bottlenecks if b.tier == "emerging"],
        "hidden_constraints": [b.model_dump() for b in bottlenecks.bottlenecks if b.tier == "hidden"],
        "first_order_effects": [e.model_dump() for e in effects.effects if e.order == "1"],
        "second_order_effects": [e.model_dump() for e in effects.effects if e.order == "2"],
        "third_order_effects": [e.model_dump() for e in effects.effects if e.order == "3"],
        "hidden_effects": [e.model_dump() for e in effects.effects if e.order == "hidden"],
        "psychological_analysis": psych.model_dump(),
        "regulatory_analysis": reg.model_dump(),
        "geopolitical_analysis": geo.model_dump(),
        "value_capture": [v.model_dump() for v in value.layers],
        "potential_winners": aggregate_entity_entries(
            [o.potential_winners for o in opps.opportunities]
        ),
        "potential_losers": aggregate_entity_entries(
            [o.potential_losers for o in opps.opportunities]
        ),
        "market_misconceptions": psych.hidden_assumptions,
        "investment_opportunities": [o.model_dump() for o in opps.opportunities],
        "portfolio_implications": {
            "narrative_score": score.model_dump(),
            "composite": composite,
        },
        "confidence_assessment": {
            "conviction": score.conviction,
            "composite": composite,
        },
    }


# --- Orchestration -----------------------------------------------------------

async def synthesize_one(
    session_factory,
    work: NarrativeWork,
    slug_map: dict[str, Narrative],
) -> dict[str, Any]:
    """Run all 12 pipeline stages for a single narrative and persist results.

    DB connections are held only briefly for context KB load and final persist —
    not during slow LLM calls.
    """
    log.info("Synthesizing narrative: %s", work.name)
    context = await _build_context(session_factory, work)

    (discovery, deps, inter, bottlenecks, value, psych, foresight, effects,
     reg, geo, opps, score) = await asyncio.gather(
        _stage_discovery(work, context),
        _stage_dependencies(work, context),
        _stage_interactions(work),
        _stage_bottlenecks(work, context),
        _stage_value(work),
        _stage_psychology(work),
        _stage_foresight(work),
        _stage_effects(work),
        _stage_regulatory(work),
        _stage_geopolitical(work),
        _stage_opportunities(work),
        _stage_score(work),
    )

    opp_scores = await _score_opportunities(work, opps)

    async with session_factory() as session:
        narrative = await session.get(Narrative, work.id)
        if narrative is None:
            raise ValueError(f"Narrative {work.id} not found")
        payload = await _persist(
            session, narrative, discovery, deps, inter, bottlenecks, value, psych,
            foresight, effects, reg, geo, opps, score, slug_map, opp_scores,
        )
        await session.commit()
    log.info("Finished narrative: %s", work.name)
    return payload


async def _update_job(session_factory, job_id: str, *, done_delta: int = 0, current: str | None = None, status: str | None = None) -> None:
    async with session_factory() as session:
        job = await session.get(Job, job_id)
        if not job:
            return
        if done_delta:
            job.done += done_delta
        if current is not None:
            job.current = current
        if status is not None:
            job.status = status
            if status in ("done", "error"):
                job.finished_at = datetime.utcnow()
        await session.commit()


async def synthesize_all(session_factory, job_id: str | None = None) -> None:
    """Synthesize all narratives in parallel, bounded by pipeline_concurrency."""
    async with session_factory() as session:
        all_rows = (
            await session.execute(
                select(Narrative).options(selectinload(Narrative.parent))
            )
        ).scalars().all()
        slug_map = _slug_to_narrative_map(all_rows)
        works = [_narrative_to_work(n) for n in all_rows]

    if job_id:
        await _update_job(session_factory, job_id, status="running", current=None)
        async with session_factory() as session:
            job = await session.get(Job, job_id)
            if job:
                job.total = len(works)
                await session.commit()

    sem = asyncio.Semaphore(settings.pipeline_concurrency)

    async def _wrapped(work: NarrativeWork) -> None:
        async with sem:
            try:
                await synthesize_one(session_factory, work, slug_map)
            except Exception as exc:  # noqa: BLE001
                log.exception("Failed narrative %s: %s", work.name, exc)
            if job_id:
                await _update_job(session_factory, job_id, done_delta=1, current=work.name)

    await asyncio.gather(*[_wrapped(w) for w in works])

    if job_id:
        await _update_job(session_factory, job_id, status="done")
