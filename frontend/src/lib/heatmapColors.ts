/** Soft pastel score tiers — readable, low-contrast heatmap fills. */

export interface ScoreColors {
  bg: string;
  text: string;
  border: string;
}

const TIERS: { min: number; colors: ScoreColors }[] = [
  {
    min: 8,
    colors: { bg: "#d8eaee", text: "#3a5f6a", border: "#c5dfe6" },
  },
  {
    min: 6,
    colors: { bg: "#e4f2f5", text: "#4a727c", border: "#d2e8ed" },
  },
  {
    min: 4,
    colors: { bg: "#eef6f8", text: "#5f838c", border: "#e0eef2" },
  },
  {
    min: 2,
    colors: { bg: "#f7f4ed", text: "#857a66", border: "#ebe6dc" },
  },
  {
    min: 0.01,
    colors: { bg: "#f8f3f1", text: "#958580", border: "#ede6e2" },
  },
];

const EMPTY: ScoreColors = {
  bg: "#f6f7f9",
  text: "#b4bcc6",
  border: "#e8ecf0",
};

export function getScoreColors(v: number): ScoreColors {
  if (v <= 0) return EMPTY;
  for (const tier of TIERS) {
    if (v >= tier.min) return tier.colors;
  }
  return EMPTY;
}

/** @deprecated use ScoreCell component */
export function scoreCellClass(v: number): string {
  if (v <= 0) return "bg-ink-50 text-ink-300";
  if (v >= 8) return "bg-[#d8eaee] text-[#3a5f6a]";
  if (v >= 6) return "bg-[#e4f2f5] text-[#4a727c]";
  if (v >= 4) return "bg-[#eef6f8] text-[#5f838c]";
  if (v >= 2) return "bg-[#f7f4ed] text-[#857a66]";
  return "bg-[#f8f3f1] text-[#958580]";
}

export function scoreChipClass(v: number): string {
  if (v >= 7) return "border text-[#4a727c]";
  if (v >= 5) return "border text-[#857a66]";
  return "border text-[#958580]";
}

export function scoreChipStyle(v: number): { backgroundColor: string; color: string; borderColor: string } {
  const c = getScoreColors(v);
  return {
    backgroundColor: c.bg,
    color: c.text,
    borderColor: c.border,
  };
}

export function scoreTextClass(v: number): string {
  if (v >= 7) return "text-[#4a727c]";
  if (v >= 5) return "text-[#857a66]";
  return "text-[#958580]";
}

export const SCORE_LEGEND = [
  { label: "8–10", min: 8 },
  { label: "6–7.9", min: 6 },
  { label: "4–5.9", min: 4 },
  { label: "2–3.9", min: 2 },
  { label: "0–1.9", min: 0.01 },
] as const;

export const SCORE_GRADIENT =
  "linear-gradient(90deg, #f8f3f1 0%, #f7f4ed 24%, #eef6f8 52%, #e4f2f5 78%, #d8eaee 100%)";
