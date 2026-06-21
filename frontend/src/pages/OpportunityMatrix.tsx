import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { appPath } from "../lib/routes";
import { aggregateEntityEntries } from "../lib/entityList";

export default function OpportunityMatrix() {
  const [contrarianOnly, setContrarianOnly] = useState(false);
  const list = useQuery({
    queryKey: ["opportunities", contrarianOnly],
    queryFn: () => api.opportunities.list(contrarianOnly || undefined),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Opportunity Matrix</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={contrarianOnly}
            onChange={(e) => setContrarianOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Contrarian only
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(list.data ?? []).map((o) => {
          const winners = aggregateEntityEntries(o.potential_winners);
          const losers = aggregateEntityEntries(o.potential_losers);
          return (
          <div key={o.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{o.title}</h3>
              <span
                className={`chip ${
                  o.type === "contrarian"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-brand-50 text-brand-700"
                }`}
              >
                {o.type}
              </span>
            </div>
            {o.thesis && <p className="mt-2 text-sm text-slate-600">{o.thesis}</p>}
            {o.awareness_gap && (
              <p className="mt-2 text-xs italic text-slate-500">
                Awareness gap: {o.awareness_gap}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="mb-1.5 font-semibold text-emerald-600">Potential Winners</div>
                <ul className="space-y-1.5">
                  {winners.map((entry) => (
                    <li key={entry.name}>
                      <div className="font-medium text-slate-800">{entry.name}</div>
                      {entry.reason && (
                        <div className="text-slate-500">{entry.reason}</div>
                      )}
                    </li>
                  ))}
                  {!winners.length && <li className="text-slate-400">—</li>}
                </ul>
              </div>
              <div>
                <div className="mb-1.5 font-semibold text-red-600">Potential Losers</div>
                <ul className="space-y-1.5">
                  {losers.map((entry) => (
                    <li key={entry.name}>
                      <div className="font-medium text-slate-800">{entry.name}</div>
                      {entry.reason && (
                        <div className="text-slate-500">{entry.reason}</div>
                      )}
                    </li>
                  ))}
                  {!losers.length && <li className="text-slate-400">—</li>}
                </ul>
              </div>
            </div>
            <Link
              to={`${appPath("/narratives")}/${o.narrative_id}`}
              className="mt-3 inline-block text-xs text-brand-600 hover:underline"
            >
              View narrative →
            </Link>
          </div>
          );
        })}
        {list.isLoading && (
          <div className="card p-5 text-sm text-slate-500">Loading opportunities...</div>
        )}
      </div>
    </div>
  );
}
