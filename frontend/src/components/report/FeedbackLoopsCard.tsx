import ReportSection from "./ReportSection";

interface Interaction {
  target_narrative?: string;
  kind?: string;
  description?: string;
  strength?: number;
}

const kindStyle: Record<string, string> = {
  reinforcing: "bg-emerald-100 text-emerald-800",
  suppressing: "bg-red-100 text-red-800",
  resource_competition: "bg-amber-100 text-amber-800",
};

export default function FeedbackLoopsCard({ items }: { items?: Interaction[] }) {
  if (!items || items.length === 0) return null;

  return (
    <ReportSection title="Feedback Loops">
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg border border-slate-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {it.target_narrative}
              </span>
              {it.kind && (
                <span
                  className={`chip text-xs ${kindStyle[it.kind] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {it.kind.replace(/_/g, " ")}
                </span>
              )}
              {it.strength !== undefined && (
                <span className="text-xs text-slate-400">strength {it.strength}</span>
              )}
            </div>
            {it.description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {it.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </ReportSection>
  );
}
