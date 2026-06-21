import ReportSection from "./ReportSection";
import CompanyTags from "./CompanyTags";
import { aggregateEntityEntries } from "../../lib/entityList";

interface Bottleneck {
  name: string;
  cause?: string;
  severity?: number;
  time_horizon?: string;
  market_awareness?: string;
  tier?: string;
  winners?: unknown[];
  losers?: unknown[];
}

interface Props {
  title: string;
  items?: Bottleneck[];
  accent?: "red" | "amber" | "orange";
}

function severityBadge(severity: number) {
  if (severity >= 7) return "bg-red-100 text-red-700 border-red-200";
  if (severity >= 4) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

export default function BottleneckListCard({
  title,
  items,
  accent = "amber",
}: Props) {
  if (!items || items.length === 0) return null;

  const dotColor =
    accent === "red" ? "bg-red-500" : accent === "orange" ? "bg-orange-500" : "bg-amber-500";

  return (
    <ReportSection title={title}>
      <ul className="space-y-4">
        {items.map((b, i) => {
          const winners = aggregateEntityEntries(b.winners);
          const losers = aggregateEntityEntries(b.losers);
          return (
            <li
              key={i}
              className="rounded-lg border border-slate-100 bg-slate-50/80 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  <span className="text-sm font-semibold text-slate-800">{b.name}</span>
                </div>
                {b.severity !== undefined && (
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${severityBadge(b.severity)}`}
                  >
                    {b.severity.toFixed(1)}
                  </span>
                )}
              </div>
              {b.cause && (
                <p className="mt-2 pl-4 text-xs leading-relaxed text-slate-600">{b.cause}</p>
              )}
              {(b.time_horizon || b.market_awareness) && (
                <div className="mt-2 flex flex-wrap gap-2 pl-4">
                  {b.time_horizon && (
                    <span className="chip text-xs">Horizon: {b.time_horizon}</span>
                  )}
                  {b.market_awareness && (
                    <span className="chip text-xs">Awareness: {b.market_awareness}</span>
                  )}
                </div>
              )}
              {(winners.length > 0 || losers.length > 0) && (
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Positive potential
                    </div>
                    <CompanyTags companies={winners} variant="positive" emptyLabel="None identified" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                      At risk
                    </div>
                    <CompanyTags companies={losers} variant="risk" emptyLabel="None identified" />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </ReportSection>
  );
}
