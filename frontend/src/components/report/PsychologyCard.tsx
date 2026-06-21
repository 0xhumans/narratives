import { useState } from "react";
import ReportSection from "./ReportSection";
import { parseBiasItem } from "./format";

interface PsychData {
  consensus_view?: string;
  hidden_assumptions?: string[];
  narrative_risks?: string[];
  biases?: string[];
}

type Tab = "biases" | "risks" | "assumptions";

export default function PsychologyCard({ data }: { data?: PsychData }) {
  const [tab, setTab] = useState<Tab>("biases");
  if (!data || Object.keys(data).length === 0) return null;

  const tabs = (
    [
      { id: "biases" as Tab, label: "Biases", items: data.biases ?? [] },
      { id: "risks" as Tab, label: "Narrative Risks", items: data.narrative_risks ?? [] },
      {
        id: "assumptions" as Tab,
        label: "Hidden Assumptions",
        items: data.hidden_assumptions ?? [],
      },
    ] as { id: Tab; label: string; items: string[] }[]
  ).filter((t) => t.items.length > 0);

  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;
  const active = tabs.find((t) => t.id === activeTab);

  return (
    <ReportSection title="Psychological Analysis" wide>
      {data.consensus_view && (
        <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50 p-4">
          <div className="mb-1 text-xs font-semibold uppercase text-brand-600">
            Consensus View
          </div>
          <p className="text-sm leading-relaxed text-slate-800">
            {data.consensus_view}
          </p>
        </div>
      )}

      {tabs.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeTab === t.id
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label} ({t.items.length})
              </button>
            ))}
          </div>

          <ul className="space-y-3">
            {(active?.items ?? []).map((item, i) => {
              if (activeTab === "biases") {
                const { label, body } = parseBiasItem(item);
                return (
                  <li
                    key={i}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
                  >
                    <span className="font-semibold text-slate-800">{label}</span>
                    <span className="text-slate-600"> — {body}</span>
                  </li>
                );
              }
              return (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </ReportSection>
  );
}
