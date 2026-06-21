import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { appPath } from "../lib/routes";

export default function NarrativeExplorer() {
  const mega = useQuery({
    queryKey: ["narratives", "mega"],
    queryFn: () => api.narratives.list({ kind: "mega" }),
  });
  const sub = useQuery({
    queryKey: ["narratives", "sub"],
    queryFn: () => api.narratives.list({ kind: "sub" }),
  });
  const heatmap = useQuery({ queryKey: ["heatmap"], queryFn: api.scores.heatmap });
  const [filter, setFilter] = useState("");

  const compositeBySlug = new Map(
    (heatmap.data?.rows ?? []).map((r) => [r.slug, r.composite])
  );

  const subByParent = useMemo(() => {
    const m = new Map<string, typeof sub.data>();
    for (const s of sub.data ?? []) {
      if (!s.parent_id) continue;
      const list = m.get(s.parent_id) ?? [];
      list.push(s);
      m.set(s.parent_id, list);
    }
    return m;
  }, [sub.data]);

  const filteredMega = (mega.data ?? []).filter((m) =>
    m.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Narrative Explorer</h1>
        <input
          type="text"
          placeholder="Filter narratives..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="space-y-4">
        {filteredMega.map((m) => {
          const composite = compositeBySlug.get(m.slug);
          const subs = subByParent.get(m.id) ?? [];
          return (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between">
                <Link
                  to={`${appPath("/narratives")}/${m.slug}`}
                  className="text-lg font-semibold text-slate-900 hover:underline"
                >
                  {m.name}
                </Link>
                {composite !== undefined && (
                  <span
                    className={`chip ${
                      composite >= 7
                        ? "bg-emerald-100 text-emerald-700"
                        : composite >= 5
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {composite.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {m.summary ?? "Not yet synthesized."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {subs.map((s) => {
                  const sc = compositeBySlug.get(s.slug);
                  return (
                    <Link
                      key={s.id}
                      to={`${appPath("/narratives")}/${s.slug}`}
                      className="chip hover:bg-slate-200"
                      title={sc !== undefined ? `composite ${sc.toFixed(1)}` : undefined}
                    >
                      {s.name}
                      {sc !== undefined && (
                        <span className="ml-1 text-xs text-slate-400">
                          {sc.toFixed(1)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        {mega.isLoading && (
          <div className="card p-5 text-sm text-slate-500">Loading narratives...</div>
        )}
      </div>
    </div>
  );
}
