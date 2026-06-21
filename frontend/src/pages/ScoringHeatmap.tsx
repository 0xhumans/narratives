import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import ScoreCell from "../components/ScoreCell";
import ScoreLegend from "../components/ScoreLegend";
import { appPath } from "../lib/routes";

type SortDir = "asc" | "desc";
type SortKey = "name" | "composite" | string;

const FACTOR_ABBR: Record<string, string> = {
  narrative_strength: "Narr.",
  adoption_probability: "Adopt",
  economic_impact: "Econ.",
  bottleneck_advantage: "Bott.",
  competitive_advantage: "Comp.",
  valuation_support: "Val.",
  market_awareness_gap: "Gap",
  second_order_effects: "2nd",
  duration: "Dur.",
  conviction: "Conv.",
};

function formatFactor(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function factorLabel(key: string): string {
  return FACTOR_ABBR[key] ?? formatFactor(key);
}

function useColumnWidths(factorCount: number) {
  return useMemo(() => {
    const idx = 2.5;
    const narrative = 15;
    const composite = 6;
    const fixed = idx + narrative + composite;
    const factorEach = factorCount > 0 ? (100 - fixed) / factorCount : 0;
    return { idx, narrative, composite, factorEach };
  }, [factorCount]);
}

function SortHeader({
  label,
  column,
  sortCol,
  sortDir,
  onSort,
  align = "left",
  className = "",
  title,
}: {
  label: string;
  column: SortKey;
  sortCol: SortKey;
  sortDir: SortDir;
  onSort: (column: SortKey) => void;
  align?: "left" | "center";
  className?: string;
  title?: string;
}) {
  const active = sortCol === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex max-w-full items-center gap-0.5 rounded px-0.5 py-0.5 transition hover:text-ink-700 ${
        align === "center" ? "mx-auto" : ""
      } ${active ? "text-ink-700" : "text-ink-400"} ${className}`}
      title={title ?? `Sort by ${label}`}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="truncate leading-tight">{label}</span>
      <span className={`shrink-0 text-[9px] ${active ? "text-ink-500" : "text-ink-300"}`} aria-hidden>
        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

export default function ScoringHeatmap() {
  const [sortCol, setSortCol] = useState<SortKey>("composite");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const heatmap = useQuery({ queryKey: ["heatmap"], queryFn: api.scores.heatmap });
  const factors = heatmap.data?.factors ?? [];
  const rows = heatmap.data?.rows ?? [];
  const widths = useColumnWidths(factors.length);

  const handleSort = (column: SortKey) => {
    if (sortCol === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortCol(column);
    setSortDir(column === "name" ? "asc" : "desc");
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.slug.includes(q));
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name") {
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      } else if (sortCol === "composite") {
        cmp = a.composite - b.composite;
      } else {
        cmp = (a.scores[sortCol] ?? 0) - (b.scores[sortCol] ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filteredRows, sortCol, sortDir]);

  const headCell = "border-b border-ink-100/60 bg-white px-1 py-2 text-ink-500";

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-ink-900 sm:text-3xl">
            Scoring Heatmap
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Investment scores by narrative — click a column to sort.
          </p>
        </div>
        {rows.length > 0 && (
          <span className="text-sm text-ink-400">
            {rows.length} narratives · sorted by{" "}
            <span className="font-medium text-ink-600">
              {sortCol === "name" ? "name" : sortCol === "composite" ? "composite" : factorLabel(sortCol)}
            </span>
          </span>
        )}
      </header>

      <ScoreLegend />

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter…"
          className="w-full max-w-[11rem] rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-sm text-ink-700 placeholder:text-ink-300 focus:border-ink-200 focus:outline-none focus:ring-1 focus:ring-ink-100"
        />
        <span className="text-xs text-ink-400">{sortedRows.length} shown</span>
      </div>

      <div className="rounded-xl border border-ink-100/70 bg-white">
        <table className="heatmap-table w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col style={{ width: `${widths.idx}%` }} />
            <col style={{ width: `${widths.narrative}%` }} />
            {factors.map((f) => (
              <col key={f} style={{ width: `${widths.factorEach}%` }} />
            ))}
            <col style={{ width: `${widths.composite}%` }} />
          </colgroup>
          <thead>
            <tr>
              <th className={`${headCell} text-center text-[10px] font-medium`}>#</th>
              <th className={`${headCell} px-2 text-left`}>
                <SortHeader
                  label="Narrative"
                  column="name"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-[11px] font-medium"
                />
              </th>
              {factors.map((f) => (
                <th key={f} className={`${headCell} text-center`}>
                  <SortHeader
                    label={factorLabel(f)}
                    column={f}
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                    title={formatFactor(f)}
                    className="text-[10px] font-medium"
                  />
                </th>
              ))}
              <th className={`${headCell} border-l border-ink-100/80 text-center`}>
                <SortHeader
                  label="All"
                  column="composite"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={handleSort}
                  align="center"
                  title="Composite score"
                  className="text-[10px] font-semibold text-ink-600"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {heatmap.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={factors.length + 3} className="border-b border-ink-50 px-3 py-2">
                    <div className="h-7 rounded bg-ink-50" />
                  </td>
                </tr>
              ))}

            {!heatmap.isLoading &&
              sortedRows.map((r, index) => (
                <tr key={r.narrative_id} className="group/row">
                  <td className="row-num border-b border-ink-50/80 px-1 py-1.5 text-center text-[10px] tabular-nums text-ink-300">
                    {index + 1}
                  </td>
                  <td className="narrative-cell border-b border-ink-50/80 px-2 py-1.5">
                    <Link
                      to={`${appPath("/narratives")}/${r.slug}`}
                      className="block truncate text-[12px] font-medium text-ink-700 transition hover:text-signal-700"
                      title={r.name}
                    >
                      {r.name}
                    </Link>
                  </td>
                  {factors.map((f) => {
                    const v = r.scores[f] ?? 0;
                    return (
                      <td key={f} className="score-cell border-b border-ink-50/80 px-0.5 py-1">
                        <ScoreCell value={v} variant="heatmap" />
                      </td>
                    );
                  })}
                  <td className="score-cell border-b border-l border-ink-100/60 px-0.5 py-1">
                    <ScoreCell value={r.composite} emphasized variant="heatmap" />
                  </td>
                </tr>
              ))}

            {!heatmap.isLoading && sortedRows.length === 0 && (
              <tr>
                <td colSpan={factors.length + 3} className="px-4 py-12 text-center text-sm text-ink-400">
                  {rows.length === 0 ? "No scores yet — run synthesis first." : "No matching narratives."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
