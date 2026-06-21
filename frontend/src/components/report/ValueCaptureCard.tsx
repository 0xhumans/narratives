import ReportSection from "./ReportSection";
import ScoreBar from "./ScoreBar";

interface ValueLayer {
  layer_name: string;
  role?: string;
  roic?: number;
  revenue_growth?: number;
  pricing_power?: number;
  barriers_to_entry?: number;
  notes?: string;
}

export default function ValueCaptureCard({ items }: { items?: ValueLayer[] }) {
  if (!items || items.length === 0) return null;

  return (
    <ReportSection title="Value Capture" wide>
      <div className="space-y-4">
        {items.map((v, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-100 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">{v.layer_name}</span>
              {v.role && (
                <span
                  className={`chip ${
                    v.role === "capturer"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Value {v.role}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {v.roic !== undefined && (
                <ScoreBar label="ROIC" value={v.roic} />
              )}
              {v.revenue_growth !== undefined && (
                <ScoreBar label="Revenue Growth" value={v.revenue_growth} />
              )}
              {v.pricing_power !== undefined && (
                <ScoreBar label="Pricing Power" value={v.pricing_power} />
              )}
              {v.barriers_to_entry !== undefined && (
                <ScoreBar label="Barriers to Entry" value={v.barriers_to_entry} />
              )}
            </div>
            {v.notes && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{v.notes}</p>
            )}
          </div>
        ))}
      </div>
    </ReportSection>
  );
}
