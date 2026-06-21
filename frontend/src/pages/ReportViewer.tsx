import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import AdoptionCurveCard from "../components/report/AdoptionCurveCard";
import AnalysisCard from "../components/report/AnalysisCard";
import BlogSection from "../components/report/BlogSection";
import BlogToc from "../components/report/BlogToc";
import BottleneckListCard from "../components/report/BottleneckListCard";
import DependencyCard from "../components/report/DependencyCard";
import EntityListCard from "../components/report/EntityListCard";
import FeedbackLoopsCard from "../components/report/FeedbackLoopsCard";
import NarrativeBlogHero from "../components/report/NarrativeBlogHero";
import { NarrativeThemeProvider } from "../components/report/NarrativeThemeContext";
import OpportunityListCard from "../components/report/OpportunityListCard";
import ProseSection from "../components/report/ProseSection";
import PsychologyCard from "../components/report/PsychologyCard";
import ScoreBreakdownCard from "../components/report/ScoreBreakdownCard";
import ValueCaptureCard from "../components/report/ValueCaptureCard";
import { titleFromSlug } from "../lib/narrativeTheme";
import { PIPELINE_ENABLED } from "../lib/features";
import { appPath } from "../lib/routes";

export default function ReportViewer() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const report = useQuery({
    queryKey: ["report", slug],
    queryFn: () => api.reports.get(slug!),
    enabled: !!slug,
  });
  const narratives = useQuery({
    queryKey: ["narratives", "all-brief"],
    queryFn: () => api.narratives.list(),
  });

  if (report.isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />
        <p className="text-sm text-ink-500">Loading narrative brief…</p>
      </div>
    );
  }

  if (report.isError || !report.data || !slug) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <div className="card p-8">
          <h1 className="font-display text-xl text-ink-900">Report not ready</h1>
          <p className="mt-2 text-sm text-ink-500">
            No synthesis report for{" "}
            <code className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-xs">
              {slug ?? "unknown"}
            </code>
            . No synthesis report for this narrative yet.
          </p>
          {PIPELINE_ENABLED ? (
          <Link to={appPath("/pipeline")} className="btn mt-6">
            Open Pipeline Console
          </Link>
          ) : (
          <Link to={appPath("/narratives")} className="btn mt-6">
            Browse narratives
          </Link>
          )}
        </div>
      </div>
    );
  }

  const p = report.data.payload;
  const composite = p.portfolio_implications?.composite;
  const conviction = p.confidence_assessment?.conviction;
  const narrativeList = (narratives.data ?? []).map((n) => ({
    slug: n.slug,
    name: n.name,
  }));
  const displayName =
    narrativeList.find((n) => n.slug === slug)?.name ?? titleFromSlug(slug);

  return (
    <NarrativeThemeProvider slug={slug}>
      <article className="mx-auto max-w-5xl space-y-10 pb-16">
        <NarrativeBlogHero
          slug={slug}
          title={displayName}
          generatedAt={report.data.generated_at}
          version={report.data.version}
          composite={composite}
          conviction={conviction}
          narratives={narrativeList.length ? narrativeList : [{ slug, name: displayName }]}
          onNavigate={(s) => navigate(`${appPath("/narratives")}/${s}`)}
        />

        <BlogToc />

        <BlogSection
          id="thesis"
          title="Investment thesis"
          lead="What the market is pricing in — and what the narrative actually implies."
        >
          <ProseSection title="Executive summary" content={p.narrative_summary} lead />
          <ProseSection title="Key drivers" items={p.key_drivers} />
        </BlogSection>

        <BlogSection
          id="timing"
          title="Market timing"
          lead="Where we are on the adoption curve and what could accelerate or delay the theme."
        >
          <AdoptionCurveCard data={p.adoption_curve_analysis} />
          <PsychologyCard data={p.psychological_analysis} />
        </BlogSection>

        <BlogSection
          id="structure"
          title="Structural map"
          lead="Dependencies, feedback loops, and where value accrues in the stack."
        >
          <DependencyCard items={p.dependency_network} />
          <FeedbackLoopsCard items={p.feedback_loops} />
          <ValueCaptureCard items={p.value_capture} />
        </BlogSection>

        <BlogSection
          id="risks"
          title="Constraints & bottlenecks"
          lead="What could break the narrative — today, tomorrow, and what markets ignore."
        >
          <BottleneckListCard title="Current bottlenecks" items={p.current_bottlenecks} accent="red" />
          <BottleneckListCard title="Future bottlenecks" items={p.future_bottlenecks} accent="amber" />
          <BottleneckListCard title="Hidden constraints" items={p.hidden_constraints} accent="orange" />
          <ProseSection title="Market misconceptions" items={p.market_misconceptions} />
        </BlogSection>

        <BlogSection
          id="effects"
          title="Cascade effects"
          lead="First-, second-, and third-order impacts — plus effects still off consensus."
        >
          <ProseSection
            title="First-order"
            items={p.first_order_effects?.map((e: { description: string }) => e.description)}
          />
          <ProseSection
            title="Second-order"
            items={p.second_order_effects?.map((e: { description: string }) => e.description)}
          />
          <ProseSection
            title="Third-order"
            items={p.third_order_effects?.map((e: { description: string }) => e.description)}
          />
          <ProseSection
            title="Hidden effects"
            items={p.hidden_effects?.map((e: { description: string }) => e.description)}
          />
        </BlogSection>

        <BlogSection
          id="opportunities"
          title="Actionable opportunities"
          lead="Direct and contrarian angles with awareness gaps and named beneficiaries."
          wide
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnalysisCard title="Regulatory landscape" data={p.regulatory_analysis} positiveLabel="Catalysts" />
            <AnalysisCard title="Geopolitical context" data={p.geopolitical_analysis} />
          </div>
          <OpportunityListCard items={p.investment_opportunities} />
        </BlogSection>

        <BlogSection
          id="score"
          title="Conviction scorecard"
          lead="Factor-by-factor breakdown of thematic strength."
          wide
        >
          <ScoreBreakdownCard data={p.portfolio_implications} />
        </BlogSection>

        <BlogSection
          id="names"
          title="Winners & losers"
          lead="Entities most aligned — or exposed — if this narrative plays out."
        >
          <EntityListCard title="Potential winners" items={p.potential_winners} variant="winners" />
          <EntityListCard title="Potential losers" items={p.potential_losers} variant="losers" />
        </BlogSection>

        <footer className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-5 text-center text-xs text-ink-400">
          Research intelligence · not investment advice · Generated by NIE synthesis pipeline
        </footer>
      </article>
    </NarrativeThemeProvider>
  );
}
