import ReportSection from "./ReportSection";
import { aggregateEntityEntries, type EntityEntry } from "../../lib/entityList";

interface Props {
  title: string;
  items?: unknown;
  variant?: "winners" | "losers";
}

function EntityRow({
  entry,
  variant,
}: {
  entry: EntityEntry;
  variant: "winners" | "losers";
}) {
  const accent =
    variant === "winners"
      ? "border-emerald-100 bg-emerald-50/30"
      : "border-red-100 bg-red-50/30";
  const dot = variant === "winners" ? "bg-emerald-500" : "bg-red-500";

  return (
    <li className={`rounded-lg border p-3 ${accent}`}>
      <div className="flex gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink-900">{entry.name}</div>
          {entry.reason && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{entry.reason}</p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function EntityListCard({ title, items, variant = "winners" }: Props) {
  const entries = aggregateEntityEntries(items);
  if (entries.length === 0) return null;

  return (
    <ReportSection title={title}>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <EntityRow key={entry.name} entry={entry} variant={variant} />
        ))}
      </ul>
    </ReportSection>
  );
}

export { EntityRow };
