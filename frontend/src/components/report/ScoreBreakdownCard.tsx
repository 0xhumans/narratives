import ReportSection from "./ReportSection";
import ScoreBar from "./ScoreBar";
import { scoreTextColor } from "./format";

const FACTOR_KEYS = [
  "narrative_strength",
  "adoption_probability",
  "economic_impact",
  "bottleneck_advantage",
  "competitive_advantage",
  "valuation_support",
  "market_awareness_gap",
  "second_order_effects",
  "duration",
  "conviction",
] as const;

interface PortfolioData {
  composite?: number;
  narrative_score?: Record<string, number>;
}

export default function ScoreBreakdownCard({ data }: { data?: PortfolioData }) {
  if (!data?.narrative_score) return null;

  const scores = data.narrative_score;
  const composite = data.composite ?? scores.composite;

  return (
    <ReportSection title="Investment Score Breakdown" wide>
      {composite !== undefined && (
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border p-4" style={{ borderColor: "rgb(var(--blog-accent-rgb) / 0.25)", backgroundColor: "rgb(var(--blog-accent-rgb) / 0.06)" }}>
          <div>
            <div className="text-xs font-medium uppercase text-slate-500">
              Composite Score
            </div>
            <div className={`text-3xl font-bold tabular-nums ${scoreTextColor(composite)}`}>
              {Number(composite).toFixed(1)}
              <span className="text-lg text-slate-400">/10</span>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Weighted average across all investment factors for this narrative.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FACTOR_KEYS.map((key) => {
          const val = scores[key];
          if (val === undefined) return null;
          return <ScoreBar key={key} label={key} value={val} />;
        })}
      </div>
    </ReportSection>
  );
}
