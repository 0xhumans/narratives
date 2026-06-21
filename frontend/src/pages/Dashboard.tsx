import { useQuery } from "@tanstack/react-query";

import { Link } from "react-router-dom";

import { api } from "../api/client";

import NarrativeLifecycleChart from "../components/NarrativeLifecycleChart";

import { usePipeline } from "../hooks/usePipeline";

import { scoreChipStyle } from "../lib/heatmapColors";
import { PIPELINE_ENABLED } from "../lib/features";
import { appPath } from "../lib/routes";
export default function Dashboard() {

  const narratives = useQuery({

    queryKey: ["narratives", "mega"],

    queryFn: () => api.narratives.list({ kind: "mega" }),

  });

  const heatmap = useQuery({ queryKey: ["heatmap"], queryFn: api.scores.heatmap });

  const bottlenecks = useQuery({

    queryKey: ["bottlenecks", "all"],

    queryFn: () => api.bottlenecks.list(),

  });

  const opportunities = useQuery({

    queryKey: ["opportunities", "all"],

    queryFn: () => api.opportunities.list(),

  });



  const pipeline = usePipeline(() => {

    narratives.refetch();

    heatmap.refetch();

    bottlenecks.refetch();

    opportunities.refetch();

  });



  const compositeBySlug = new Map(

    (heatmap.data?.rows ?? []).map((r) => [r.slug, r.composite])

  );



  const reportsCount = heatmap.data?.rows.length ?? 0;

  const hiddenCount = (bottlenecks.data ?? []).filter(

    (b) => b.tier === "hidden"

  ).length;

  const contrarianCount = (opportunities.data ?? []).filter(

    (o) => o.type === "contrarian"

  ).length;



  const stats = [

    { label: "Mega Narratives", value: narratives.data?.length ?? 0, accent: "text-brand-600" },

    { label: "Synthesized Reports", value: reportsCount, accent: "text-brand-700" },

    { label: "Bottlenecks", value: bottlenecks.data?.length ?? 0, accent: "text-neutral-900" },

    { label: "Hidden Bottlenecks", value: hiddenCount, accent: "text-coral-800" },

    { label: "Opportunities", value: opportunities.data?.length ?? 0, accent: "text-brand-600" },

    { label: "Contrarian", value: contrarianCount, accent: "text-amber-700" },

  ];



  return (

    <div className="space-y-8">

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-2xl font-bold text-neutral-850">

            Narrative Intelligence Engine

          </h1>

          <p className="text-sm text-neutral-900/60">

            Modeling investment narratives, dependencies, bottlenecks, and opportunities.

          </p>

        </div>

        {PIPELINE_ENABLED && (
        <button

          className="btn"

          disabled={pipeline.isRunning}

          onClick={() => pipeline.start()}

        >

          {pipeline.isRunning ? (

            <>

              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />

              Running... {pipeline.progressPct}%

            </>

          ) : (

            <>▶ Run Synthesis</>

          )}

        </button>
        )}

      </div>



      {PIPELINE_ENABLED && pipeline.job && (

        <div className="card p-4">

          <div className="mb-2 flex items-center justify-between text-sm">

            <span>

              Pipeline job{" "}

              <code className="chip bg-neutral-100 font-mono text-neutral-900">

                {pipeline.job.id.slice(0, 12)}

              </code>{" "}

              status:{" "}

              <strong

                className={

                  pipeline.job.status === "done"

                    ? "text-brand-700"

                    : pipeline.job.status === "error"

                    ? "text-coral-800"

                    : "text-brand-600"

                }

              >

                {pipeline.job.status}

              </strong>

            </span>

            <span className="text-neutral-900/50">

              {pipeline.job.done}/{pipeline.job.total} narratives

            </span>

          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">

            <div

              className="h-full rounded-full bg-brand-500 transition-all duration-500"

              style={{ width: `${pipeline.progressPct}%` }}

            />

          </div>

          {pipeline.job.current && pipeline.isRunning && (

            <div className="mt-2 text-xs text-neutral-900/50">

              Currently synthesizing: <strong>{pipeline.job.current}</strong>

            </div>

          )}

          {pipeline.error && (

            <div className="mt-2 text-xs text-coral-800">Error: {pipeline.error}</div>

          )}

        </div>

      )}



      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

        {stats.map((s) => (

          <div key={s.label} className="card p-4">

            <div className={`text-2xl font-bold tabular-nums ${s.accent}`}>{s.value}</div>

            <div className="text-xs text-neutral-900/50">{s.label}</div>

          </div>

        ))}

      </div>



      <NarrativeLifecycleChart />



      <div>

        <h2 className="mb-4 text-lg font-semibold text-neutral-850">Mega Narratives</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {(narratives.data ?? []).map((n) => {

            const composite = compositeBySlug.get(n.slug);

            return (

              <Link

                key={n.id}

                to={`${appPath("/narratives")}/${n.slug}`}

                className="card block p-5 transition hover:border-brand-200 hover:shadow-lift"

              >

                <div className="flex items-start justify-between gap-2">

                  <h3 className="font-semibold text-neutral-850">{n.name}</h3>

                  {composite !== undefined && (

                    <span
                      className="chip tabular-nums border"
                      style={scoreChipStyle(composite)}
                    >

                      {composite.toFixed(1)}

                    </span>

                  )}

                </div>

                <p className="mt-2 line-clamp-3 text-sm text-neutral-900/60">

                  {n.summary ?? "No summary yet — run synthesis."}

                </p>

                {composite !== undefined && (

                  <div className="mt-3 text-xs font-medium text-brand-600">

                    View full report →

                  </div>

                )}

              </Link>

            );

          })}

          {narratives.isLoading && (

            <div className="card p-5 text-sm text-neutral-500">Loading narratives...</div>

          )}

        </div>

      </div>

    </div>

  );

}


