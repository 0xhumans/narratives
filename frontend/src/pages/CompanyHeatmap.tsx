import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import ScoreCell from "../components/ScoreCell";
import ScoreLegend from "../components/ScoreLegend";
import {
  displayCompanyName,
  normalizeCompanyRows,
  type NormalizedCompanyHeatmapRow,
} from "../lib/companyHeatmap";

type SortDir = "asc" | "desc";
type SortKey =
  | "company"
  | "weighted_score"
  | "composite"
  | "narrative_count"
  | "mega_count"
  | string;

const MEGA_ABBR: Record<string, string> = {
  "aging-population": "Aging",
  "artificial-intelligence": "AI",
  "biotechnology-revolution": "Bio",
  "climate-adaptation": "Climate",
  "cybersecurity-digital-trust": "Cyber",
  "defense-autonomy": "Defense",
  "electrification-autonomous-mobility": "E-Mob",
  "energy-transition-storage": "Energy",
  "nuclear-renaissance": "Nuclear",
  reindustrialization: "Reind.",
  "resource-scarcity": "Resources",
  robotics: "Robotics",
  "space-economy": "Space",
};

function megaLabel(slug: string, name: string): string {
  return MEGA_ABBR[slug] ?? name.split(/\s+/)[0]?.slice(0, 8) ?? name.slice(0, 8);
}

function SortHeader({
  label,
  column,
  sortCol,
  sortDir,
  onSort,
  align = "center",
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

function compareRows(a: NormalizedCompanyHeatmapRow, b: NormalizedCompanyHeatmapRow, sortCol: SortKey): number {
  if (sortCol === "company") {
    return a.company.localeCompare(b.company, undefined, { sensitivity: "base" });
  }
  if (sortCol === "weighted_score") return a.weighted_score - b.weighted_score;
  if (sortCol === "composite") return a.composite - b.composite;
  if (sortCol === "narrative_count") return a.narrative_count - b.narrative_count;
  if (sortCol === "mega_count") return a.mega_count - b.mega_count;
  return (a.scores[sortCol] ?? 0) - (b.scores[sortCol] ?? 0);
}

function sortRows(rows: NormalizedCompanyHeatmapRow[], sortCol: SortKey, sortDir: SortDir) {
  const copy = [...rows];
  copy.sort((a, b) => {
    const cmp = compareRows(a, b, sortCol);
    return sortDir === "asc" ? cmp : -cmp;
  });
  return copy;
}

function companyLine(row: NormalizedCompanyHeatmapRow): string {
  const name = displayCompanyName(row.company, row.ticker);
  return row.ticker ? `${name} · ${row.ticker}` : name;
}

function useColumnWidths(megaCount: number) {
  return useMemo(() => {
    const idx = 2.5;
    const company = 13;
    const wtd = 5;
    const narr = 2.5;
    const overall = 5;
    const fixed = idx + company + wtd + narr + overall;
    const megaEach = megaCount > 0 ? (100 - fixed) / megaCount : 0;
    return { idx, company, wtd, narr, overall, megaEach };
  }, [megaCount]);
}

export default function CompanyHeatmap() {
  const [sortCol, setSortCol] = useState<SortKey>("weighted_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [junctionOnly, setJunctionOnly] = useState(false);
  const [stocksOnly, setStocksOnly] = useState(false);
  const [search, setSearch] = useState("");

  const heatmap = useQuery({
    queryKey: ["company-heatmap"],
    queryFn: () => api.opportunities.companyHeatmap(),
  });

  const columns = heatmap.data?.columns ?? [];
  const widths = useColumnWidths(columns.length);

  const handleSort = (column: SortKey) => {
    if (sortCol === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortCol(column);
    setSortDir(column === "company" ? "asc" : "desc");
  };

  const relevantRows = useMemo(
    () => normalizeCompanyRows(heatmap.data?.rows ?? []),
    [heatmap.data]
  );

  const sortedRows = useMemo(() => {
    if (!heatmap.data) return [];
    let rows = relevantRows;
    if (stocksOnly) rows = rows.filter((r) => r.ticker);
    if (junctionOnly) rows = rows.filter((r) => r.mega_count >= 2);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.company.toLowerCase().includes(q) ||
          (r.ticker?.toLowerCase().includes(q) ?? false)
      );
    }
    return sortRows(rows, sortCol, sortDir);
  }, [heatmap.data, relevantRows, sortCol, sortDir, junctionOnly, stocksOnly, search]);

  const junctionCount = relevantRows.filter((r) => r.mega_count >= 2).length;
  const stockCount = relevantRows.filter((r) => r.ticker).length;

  const headCell = "border-b border-ink-100/60 bg-white px-1 py-2 text-ink-500";

  const sortLabel =
    sortCol === "company"
      ? "company"
      : sortCol === "weighted_score"
        ? "weighted"
        : sortCol === "composite"
          ? "overall"
          : sortCol === "narrative_count"
            ? "narratives"
            : columns.find((c) => c.slug === sortCol)?.name ?? sortCol;

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-ink-900 sm:text-3xl">
            Company Junction Heatmap
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Opportunity winners by mega narrative — click a column to sort.
          </p>
        </div>
        {relevantRows.length > 0 && (
          <span className="text-sm text-ink-400">
            {relevantRows.length} companies · sorted by{" "}
            <span className="font-medium text-ink-600">{sortLabel}</span>
          </span>
        )}
      </header>

      <ScoreLegend />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or ticker…"
            className="w-full max-w-[13rem] rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-sm text-ink-700 placeholder:text-ink-300 focus:border-ink-200 focus:outline-none focus:ring-1 focus:ring-ink-100"
          />
          <span className="text-xs text-ink-400">{sortedRows.length} shown</span>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-ink-500">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={stocksOnly}
              onChange={(e) => setStocksOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-ink-200 accent-signal-600"
            />
            Stocks only ({stockCount})
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={junctionOnly}
              onChange={(e) => setJunctionOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-ink-200 accent-signal-600"
            />
            Multi-mega ({junctionCount})
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-ink-100/70 bg-white">
        <table className="heatmap-table w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col style={{ width: `${widths.idx}%` }} />
            <col style={{ width: `${widths.company}%` }} />
            <col style={{ width: `${widths.wtd}%` }} />
            <col style={{ width: `${widths.narr}%` }} />
            <col style={{ width: `${widths.overall}%` }} />
            {columns.map((col) => (
              <col key={col.slug} style={{ width: `${widths.megaEach}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={`${headCell} text-center text-[10px] font-medium`}>#</th>
              <th className={`${headCell} px-2 text-left`}>
                <SortHeader
                  label="Company"
                  column="company"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={handleSort}
                  align="left"
                  className="text-[11px] font-medium"
                />
              </th>
              <th className={`${headCell} text-center`}>
                <SortHeader
                  label="Wtd"
                  column="weighted_score"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={handleSort}
                  title="Weighted score"
                  className="text-[10px] font-semibold text-ink-600"
                />
              </th>
              <th className={`${headCell} text-center`}>
                <SortHeader
                  label="N"
                  column="narrative_count"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={handleSort}
                  title="Narrative count"
                  className="text-[10px] font-medium"
                />
              </th>
              <th className={`${headCell} border-l border-ink-100/80 text-center`}>
                <SortHeader
                  label="All"
                  column="composite"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={handleSort}
                  title="Overall composite"
                  className="text-[10px] font-semibold text-ink-600"
                />
              </th>
              {columns.map((col) => (
                <th key={col.slug} className={`${headCell} text-center`}>
                  <SortHeader
                    label={megaLabel(col.slug, col.name)}
                    column={col.slug}
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                    title={col.name}
                    className="text-[10px] font-medium"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5 + columns.length} className="border-b border-ink-50 px-3 py-2">
                    <div className="h-7 rounded bg-ink-50" />
                  </td>
                </tr>
              ))}

            {!heatmap.isLoading &&
              sortedRows.map((r, index) => (
                <tr key={r.company_key} className="group/row">
                  <td className="row-num border-b border-ink-50/80 px-1 py-1.5 text-center text-[10px] tabular-nums text-ink-300">
                    {index + 1}
                  </td>
                  <td
                    className="narrative-cell truncate border-b border-ink-50/80 px-2 py-1.5"
                    title={companyLine(r)}
                  >
                    <span className="text-[12px] font-medium text-ink-700">
                      {displayCompanyName(r.company, r.ticker)}
                    </span>
                    {r.ticker && (
                      <span className="text-[12px] font-normal text-ink-400"> · {r.ticker}</span>
                    )}
                  </td>
                  <td className="score-cell border-b border-ink-50/80 px-0.5 py-1">
                    <ScoreCell value={r.weighted_score} emphasized variant="heatmap" />
                  </td>
                  <td className="border-b border-ink-50/80 px-0.5 py-1.5 text-center text-[11px] tabular-nums text-ink-500">
                    {r.narrative_count}
                  </td>
                  <td className="score-cell border-b border-l border-ink-100/60 px-0.5 py-1">
                    <ScoreCell value={r.composite} variant="heatmap" />
                  </td>
                  {columns.map((col) => {
                    const v = r.scores[col.slug] ?? 0;
                    return (
                      <td
                        key={col.slug}
                        className="score-cell border-b border-ink-50/80 px-0.5 py-1"
                        title={`${companyLine(r)} · ${col.name}: ${v > 0 ? v.toFixed(1) : "—"}`}
                      >
                        <ScoreCell value={v} variant="heatmap" />
                      </td>
                    );
                  })}
                </tr>
              ))}

            {!heatmap.isLoading && sortedRows.length === 0 && (
              <tr>
                <td
                  colSpan={5 + columns.length}
                  className="px-4 py-12 text-center text-sm text-ink-400"
                >
                  {heatmap.isError
                    ? `Failed to load: ${heatmap.error?.message ?? "API error"}. Restart start.bat.`
                    : search.trim()
                      ? `No matches for "${search.trim()}".`
                      : junctionOnly
                        ? "No multi-mega companies yet."
                        : "No company data yet — run synthesis first."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
