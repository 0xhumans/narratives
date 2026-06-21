import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { scoreChipStyle } from "../lib/heatmapColors";
import { appPath } from "../lib/routes";
import type { LifecycleMapData } from "../api/types";

const PHASE_STYLES: Record<string, { header: string; body: string; dot: string }> = {
  emerging: {
    header: "bg-neutral-100 text-neutral-700",
    body: "bg-neutral-50/80",
    dot: "bg-neutral-400",
  },
  accelerating: {
    header: "bg-brand-50 text-brand-800",
    body: "bg-brand-50/50",
    dot: "bg-brand-200",
  },
  scaling: {
    header: "bg-brand-100 text-brand-800",
    body: "bg-brand-50",
    dot: "bg-brand-400",
  },
  mainstream: {
    header: "bg-brand-500 text-white",
    body: "bg-brand-50",
    dot: "bg-brand-600",
  },
  saturation: {
    header: "bg-brand-800 text-white",
    body: "bg-brand-50/70",
    dot: "bg-brand-800",
  },
};

function groupByPhase(data: LifecycleMapData) {
  const map = new Map<string, typeof data.narratives>();
  for (const phase of data.phases) {
    map.set(phase.id, []);
  }
  for (const n of data.narratives) {
    map.get(n.phase_id)?.push(n);
  }
  for (const list of map.values()) {
    list.sort((a, b) => b.composite - a.composite || a.name.localeCompare(b.name));
  }
  return map;
}

export default function NarrativeLifecycleChart() {
  const lifecycle = useQuery({
    queryKey: ["lifecycle-map"],
    queryFn: () => api.narratives.lifecycleMap(),
  });

  if (lifecycle.isLoading) {
    return (
      <div className="card p-6 text-sm text-neutral-500">Loading lifecycle map…</div>
    );
  }

  if (lifecycle.isError || !lifecycle.data?.narratives.length) {
    return (
      <div className="card p-6 text-sm text-neutral-500">
        No lifecycle data yet — run synthesis to populate adoption stages.
      </div>
    );
  }

  const grouped = groupByPhase(lifecycle.data);
  const leaders = lifecycle.data.narratives.filter((n) => n.is_leader);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-neutral-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-850">
          Narrative Lifecycle Map
        </h2>
        <p className="mt-1 text-sm text-neutral-900/60">
          Synthesized narratives placed by adoption stage. Top 3 per phase are highlighted.
        </p>
      </div>

      {/* S-curve band */}
      <div className="relative h-16 bg-gradient-to-r from-neutral-200 via-brand-200 via-30% via-brand-400 via-55% via-brand-500 via-75% to-brand-800">
        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          preserveAspectRatio="none"
          viewBox="0 0 1000 60"
        >
          <path
            d="M0,50 C150,48 250,10 400,18 S650,45 750,22 S900,8 1000,12"
            fill="none"
            stroke="white"
            strokeWidth="3"
          />
        </svg>
        {leaders.slice(0, 8).map((n, i) => {
          const phaseIndex = lifecycle.data.phases.findIndex((p) => p.id === n.phase_id);
          const left = `${8 + phaseIndex * 18 + (i % 3) * 4}%`;
          return (
            <Link
              key={n.id}
              to={`${appPath("/narratives")}/${n.slug}`}
              className="absolute top-2 max-w-[120px] truncate rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-brand-800 shadow-sm hover:bg-white"
              style={{ left, top: `${12 + (i % 2) * 18}px` }}
              title={`${n.name} · ${n.composite.toFixed(1)}`}
            >
              {n.name}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-5">
        {lifecycle.data.phases.map((phase) => {
          const style = PHASE_STYLES[phase.id] ?? PHASE_STYLES.emerging;
          const items = grouped.get(phase.id) ?? [];
          return (
            <div
              key={phase.id}
              className={`border-t border-neutral-100 md:border-l md:first:border-l-0 ${style.body}`}
            >
              <div className={`px-3 py-3 ${style.header}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className="text-sm font-semibold">{phase.label}</span>
                </div>
                <div className="mt-0.5 text-[11px] opacity-80">{phase.subtitle}</div>
                <div className="mt-1 text-[10px] font-medium opacity-70">
                  {items.length} narratives
                </div>
              </div>
              <ul className="max-h-72 space-y-1.5 overflow-y-auto px-2 py-2">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={`${appPath("/narratives")}/${n.slug}`}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-xs transition hover:shadow-sm ${
                        n.is_leader
                          ? "border-brand-400 bg-white font-semibold shadow-card"
                          : "border-transparent bg-white/70 hover:border-brand-200"
                      }`}
                    >
                      <span className="min-w-0 truncate text-neutral-850" title={n.name}>
                        {n.name}
                      </span>
                      <span
                        className="chip shrink-0 border tabular-nums"
                        style={scoreChipStyle(n.composite)}
                      >
                        {n.composite.toFixed(1)}
                      </span>
                    </Link>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="px-2 py-4 text-center text-[11px] text-neutral-400">—</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
