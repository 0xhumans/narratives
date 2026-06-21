import ReportSection from "./ReportSection";

interface AnalysisData {
  summary?: string;
  key_risks?: string[];
  catalysts?: string[];
  opportunities?: string[];
}

interface Props {
  title: string;
  data?: AnalysisData;
  /** regulatory uses catalysts; geopolitical uses opportunities */
  positiveLabel?: string;
}

export default function AnalysisCard({
  title,
  data,
  positiveLabel = "Opportunities",
}: Props) {
  if (!data || Object.keys(data).length === 0) return null;

  const positives = data.catalysts ?? data.opportunities ?? [];
  const risks = data.key_risks ?? [];

  return (
    <ReportSection title={title}>
      {data.summary && (
        <p className="mb-4 text-sm leading-relaxed text-slate-700">{data.summary}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {risks.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-red-600">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              Key Risks
            </div>
            <ul className="space-y-2">
              {risks.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-red-50 bg-red-50/50 p-2.5 text-sm leading-relaxed text-slate-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {positives.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {positiveLabel}
            </div>
            <ul className="space-y-2">
              {positives.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-emerald-50 bg-emerald-50/50 p-2.5 text-sm leading-relaxed text-slate-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ReportSection>
  );
}
