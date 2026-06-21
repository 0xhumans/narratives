import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import CompanyTags, { normalizeCompanies } from "../components/report/CompanyTags";
import { appPath } from "../lib/routes";

const TIERS = ["current", "emerging", "hidden"] as const;
type Tier = (typeof TIERS)[number];

function severityChip(severity: number): string {
  if (severity >= 7) return "bg-red-100 text-red-700";
  if (severity >= 4) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function BottleneckDashboard() {
  const [tier, setTier] = useState<Tier | "">("");
  const [search, setSearch] = useState("");

  const list = useQuery({
    queryKey: ["bottlenecks", tier],
    queryFn: () => api.bottlenecks.list(tier || undefined),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list.data ?? [];
    return (list.data ?? []).filter((b) => {
      const winners = normalizeCompanies(b.winners).join(" ").toLowerCase();
      const losers = normalizeCompanies(b.losers).join(" ").toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.narrative_name.toLowerCase().includes(q) ||
        b.mega_name.toLowerCase().includes(q) ||
        winners.includes(q) ||
        losers.includes(q)
      );
    });
  }, [list.data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bottleneck Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each bottleneck shows companies with positive potential and companies at risk.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search bottleneck, narrative, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn-ghost ${tier === "" ? "bg-brand-50 text-brand-700" : ""}`}
          onClick={() => setTier("")}
        >
          All
        </button>
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            className={`btn-ghost capitalize ${tier === t ? "bg-brand-50 text-brand-700" : ""}`}
            onClick={() => setTier(t)}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-400">
          {filtered.length} bottlenecks
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map((b) => {
          const winners = normalizeCompanies(b.winners);
          const losers = normalizeCompanies(b.losers);
          return (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`${appPath("/narratives")}/${b.narrative_slug}`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    {b.narrative_name}
                  </Link>
                  {b.mega_name !== b.narrative_name && (
                    <div className="text-[11px] text-slate-400">{b.mega_name}</div>
                  )}
                  <h3 className="mt-1 font-semibold text-slate-900">{b.name}</h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="chip capitalize">{b.tier}</span>
                  <span className={`chip ${severityChip(b.severity)}`}>
                    severity {b.severity.toFixed(1)}
                  </span>
                </div>
              </div>

              {b.cause && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{b.cause}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {b.time_horizon && <span className="chip">Horizon: {b.time_horizon}</span>}
                {b.market_awareness && (
                  <span className="chip max-w-full truncate" title={b.market_awareness}>
                    Awareness: {b.market_awareness.slice(0, 80)}
                    {b.market_awareness.length > 80 ? "…" : ""}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Positive potential ({winners.length})
                  </div>
                  <CompanyTags companies={winners} variant="positive" />
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                    At risk ({losers.length})
                  </div>
                  <CompanyTags companies={losers} variant="risk" />
                </div>
              </div>
            </div>
          );
        })}
        {list.isLoading && (
          <div className="card p-5 text-sm text-slate-500">Loading bottlenecks…</div>
        )}
        {!list.isLoading && filtered.length === 0 && (
          <div className="card p-5 text-sm text-slate-500">No bottlenecks match your filters.</div>
        )}
      </div>
    </div>
  );
}
