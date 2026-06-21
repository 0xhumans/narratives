import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { usePipeline } from "../hooks/usePipeline";
import type { HeatmapCell } from "../api/types";
import { appPath } from "../lib/routes";

type SortDir = "asc" | "desc";
type SortKey = "name" | "conviction" | "composite";

function SortHeader({
  label,
  column,
  sortCol,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortKey;
  sortCol: SortKey;
  sortDir: SortDir;
  onSort: (column: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortCol === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide transition hover:bg-slate-100 ${
        align === "right" ? "ml-auto" : ""
      } ${active ? "text-brand-700" : "text-slate-500"}`}
    >
      {label}
      <span className={active ? "text-brand-600" : "text-slate-300"} aria-hidden>
        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

function sortRows(rows: HeatmapCell[], sortCol: SortKey, sortDir: SortDir) {
  const copy = [...rows];
  copy.sort((a, b) => {
    let cmp = 0;
    if (sortCol === "name") {
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    } else if (sortCol === "conviction") {
      cmp = (a.scores.conviction ?? 0) - (b.scores.conviction ?? 0);
    } else {
      cmp = a.composite - b.composite;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });
  return copy;
}

export default function PipelineConsole() {
  const [sortCol, setSortCol] = useState<SortKey>("composite");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const heatmap = useQuery({ queryKey: ["heatmap"], queryFn: api.scores.heatmap });
  const narratives = useQuery({
    queryKey: ["narratives", "mega"],
    queryFn: () => api.narratives.list({ kind: "mega" }),
  });
  const [logLines, setLogLines] = useState<string[]>([]);

  const pipeline = usePipeline(() => {
    heatmap.refetch();
    narratives.refetch();
  });

  const reportsCount = heatmap.data?.rows.length ?? 0;
  const totalMega = narratives.data?.length ?? 10;
  const remaining = Math.max(0, totalMega - reportsCount);

  const sortedRows = useMemo(() => {
    if (!heatmap.data?.rows.length) return [];
    return sortRows(heatmap.data.rows, sortCol, sortDir);
  }, [heatmap.data, sortCol, sortDir]);

  const handleSort = (column: SortKey) => {
    if (sortCol === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortCol(column);
    setSortDir(column === "name" ? "asc" : "desc");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pipeline Console</h1>
        <p className="text-sm text-slate-500">
          Trigger and monitor the narrative synthesis pipeline powered by GLM-5.2.
        </p>
      </div>

      {/* Controls */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Synthesis Status</h2>
            <p className="mt-1 text-sm text-slate-500">
              {reportsCount} of {totalMega} mega narratives synthesized.{" "}
              {remaining > 0 && `${remaining} remaining.`}
            </p>
          </div>
          <button
            className="btn"
            disabled={pipeline.isRunning}
            onClick={() => {
              setLogLines((l) => [
                `[${new Date().toLocaleTimeString()}] Pipeline started...`,
                ...l,
              ]);
              pipeline.start();
            }}
          >
            {pipeline.isRunning
              ? `Running... ${pipeline.progressPct}%`
              : "▶ Run Full Synthesis"}
          </button>
        </div>

        {pipeline.job && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>
                Job <code className="chip font-mono">{pipeline.job.id}</code> ·{" "}
                <strong
                  className={
                    pipeline.job.status === "done"
                      ? "text-emerald-600"
                      : pipeline.job.status === "error"
                      ? "text-red-600"
                      : "text-brand-600"
                  }
                >
                  {pipeline.job.status}
                </strong>
              </span>
              <span className="text-slate-500">
                {pipeline.job.done}/{pipeline.job.total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: `${pipeline.progressPct}%` }}
              />
            </div>
            {pipeline.job.current && pipeline.isRunning && (
              <div className="mt-3 rounded bg-slate-50 p-2 text-sm">
                <span className="text-slate-500">Current:</span>{" "}
                <strong>{pipeline.job.current}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="card p-6">
        <h2 className="mb-3 text-lg font-semibold">How the Pipeline Works</h2>
        <p className="text-sm text-slate-600">
          Each narrative passes through 12 stages, each calling GLM-5.2 via OpenRouter:
        </p>
        <ol className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
          {[
            "Discovery",
            "Dependency Graph",
            "Interactions",
            "Bottlenecks",
            "Value Capture",
            "Psychology",
            "Strategic Foresight",
            "Effects (1st/2nd/3rd/hidden)",
            "Regulatory Analysis",
            "Geopolitical Analysis",
            "Opportunities (direct + contrarian)",
            "Investment Scoring (10 factors)",
          ].map((stage, i) => (
            <li
              key={stage}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {i + 1}
              </span>
              {stage}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-400">
          All narratives run in parallel (bounded by PIPELINE_CONCURRENCY). Each LLM
          response is validated against Pydantic schemas with retry-on-error. Results
          are persisted to Neon Postgres.
        </p>
      </div>

      {/* Output preview */}
      <div className="card p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Synthesized Narratives</h2>
          {sortedRows.length > 0 && (
            <span className="text-xs text-slate-400">{sortedRows.length} reports</span>
          )}
        </div>
        {sortedRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="w-10 px-2 py-2 text-xs font-semibold text-slate-400">#</th>
                  <th className="px-2 py-2">
                    <SortHeader
                      label="Narrative"
                      column="name"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-2 py-2 text-right">
                    <SortHeader
                      label="Conviction"
                      column="conviction"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                  </th>
                  <th className="px-2 py-2 text-right">
                    <SortHeader
                      label="Composite"
                      column="composite"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r, index) => (
                  <tr
                    key={r.narrative_id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-2 py-2 text-xs tabular-nums text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2 font-medium">
                      <Link
                        to={`${appPath("/narratives")}/${r.slug}`}
                        className="text-slate-900 hover:text-brand-600"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-600">
                      {(r.scores.conviction ?? 0).toFixed(1)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span
                        className={`chip tabular-nums ${
                          r.composite >= 7
                            ? "bg-emerald-100 text-emerald-700"
                            : r.composite >= 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.composite.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No reports yet. Click "Run Full Synthesis" to begin.
          </p>
        )}
      </div>
    </div>
  );
}
