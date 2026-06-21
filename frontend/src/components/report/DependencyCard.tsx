import ReportSection from "./ReportSection";

interface Dependency {
  layer: string;
  type?: string;
  weight?: number;
  description?: string;
}

export default function DependencyCard({ items }: { items?: Dependency[] }) {
  if (!items || items.length === 0) return null;

  return (
    <ReportSection title="Dependency Network">
      <ul className="space-y-2">
        {items.map((d, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
          >
            <div>
              <div className="text-sm font-medium text-slate-800">{d.layer}</div>
              {d.description && (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {d.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {d.type && <span className="chip text-xs capitalize">{d.type}</span>}
              {d.weight !== undefined && (
                <span className="text-xs font-medium text-brand-600">
                  w {d.weight}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </ReportSection>
  );
}
