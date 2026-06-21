import { aggregateEntityEntries, type EntityEntry } from "../../lib/entityList";

export function normalizeCompanies(items?: unknown[]): string[] {
  if (!items?.length) return [];
  return aggregateEntityEntries(items).map((e) =>
    e.reason ? `${e.name} (${e.reason})` : e.name
  );
}

export default function CompanyTags({
  companies,
  variant = "positive",
  emptyLabel = "—",
}: {
  companies: string[] | EntityEntry[];
  variant?: "positive" | "risk";
  emptyLabel?: string;
}) {
  const entries =
    companies.length > 0 && typeof companies[0] === "object"
      ? (companies as EntityEntry[])
      : aggregateEntityEntries(companies);

  if (entries.length === 0) {
    return <span className="text-xs text-slate-400">{emptyLabel}</span>;
  }

  const chipClass =
    variant === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <ul className="flex flex-col gap-1.5">
      {entries.map((entry) => (
        <li
          key={entry.name}
          className={`rounded-lg border px-2.5 py-1.5 ${chipClass}`}
        >
          <div className="text-xs font-semibold leading-snug">{entry.name}</div>
          {entry.reason && (
            <div className="mt-0.5 text-[11px] font-normal leading-snug opacity-85">
              {entry.reason}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
