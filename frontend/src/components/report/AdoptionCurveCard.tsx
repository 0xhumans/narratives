import ReportSection from "./ReportSection";

interface AdoptionData {
  stage?: string;
  penetration_pct?: number;
  growth_rate?: string;
  inflection_points?: string[];
}

export default function AdoptionCurveCard({ data }: { data?: AdoptionData }) {
  if (!data || Object.keys(data).length === 0) return null;

  const penetration =
    typeof data.penetration_pct === "number" ? data.penetration_pct : null;

  return (
    <ReportSection title="Adoption Curve">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {data.stage && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase text-slate-400">Stage</div>
            <div className="mt-1 text-sm font-semibold capitalize text-slate-800">
              {data.stage}
            </div>
          </div>
        )}
        {penetration !== null && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase text-slate-400">
              Penetration
            </div>
            <div className="mt-1 text-sm font-semibold text-brand-700">
              {penetration}%
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, penetration)}%`,
                  backgroundColor: "var(--blog-accent)",
                }}
              />
            </div>
          </div>
        )}
        {data.growth_rate && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase text-slate-400">
              Growth Rate
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-700">
              {data.growth_rate}
            </div>
          </div>
        )}
      </div>

      {data.inflection_points && data.inflection_points.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase text-slate-400">
            Inflection Points
          </div>
          <ol className="space-y-3">
            {data.inflection_points.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--blog-accent)" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-700">{point}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </ReportSection>
  );
}
