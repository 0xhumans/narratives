import ReportSection from "./ReportSection";
import { EntityRow } from "./EntityListCard";
import { aggregateEntityEntries } from "../../lib/entityList";

interface Opportunity {
  title: string;
  thesis?: string;
  type?: "direct" | "contrarian";
  awareness_gap?: string;
  valuation_note?: string;
  potential_winners?: unknown;
  potential_losers?: unknown;
}

export default function OpportunityListCard({ items }: { items?: Opportunity[] }) {
  if (!items || items.length === 0) return null;

  return (
    <ReportSection title="Investment Opportunities" wide>
      <div className="space-y-3">
        {items.map((o, i) => {
          const winners = aggregateEntityEntries(o.potential_winners);
          const losers = aggregateEntityEntries(o.potential_losers);

          return (
            <div
              key={i}
              className="rounded-xl border border-ink-100 p-4 transition hover:shadow-card"
              style={{ borderColor: "rgb(var(--blog-accent-rgb) / 0.15)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{o.title}</h3>
                {o.type && (
                  <span
                    className={`chip ${
                      o.type === "contrarian"
                        ? "bg-amber-100 text-amber-800"
                        : "text-white"
                    }`}
                    style={
                      o.type !== "contrarian"
                        ? { backgroundColor: "var(--blog-accent)" }
                        : undefined
                    }
                  >
                    {o.type}
                  </span>
                )}
              </div>
              {o.thesis && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{o.thesis}</p>
              )}
              {o.awareness_gap && (
                <p className="mt-2 text-xs italic text-slate-500">
                  Awareness gap: {o.awareness_gap}
                </p>
              )}
              {o.valuation_note && (
                <p className="mt-1 text-xs text-slate-500">Valuation: {o.valuation_note}</p>
              )}
              {(winners.length > 0 || losers.length > 0) && (
                <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                  {winners.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Winners
                      </div>
                      <ul className="space-y-2">
                        {winners.map((entry) => (
                          <EntityRow key={entry.name} entry={entry} variant="winners" />
                        ))}
                      </ul>
                    </div>
                  )}
                  {losers.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                        Losers
                      </div>
                      <ul className="space-y-2">
                        {losers.map((entry) => (
                          <EntityRow key={entry.name} entry={entry} variant="losers" />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ReportSection>
  );
}
