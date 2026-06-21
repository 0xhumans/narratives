export function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreColor(v: number): string {
  if (v >= 8) return "bg-brand-600";
  if (v >= 6) return "bg-brand-400";
  if (v >= 4) return "bg-brand-100";
  if (v >= 2) return "bg-amber-100";
  return "bg-coral-100";
}

export function scoreTextColor(v: number): string {
  if (v >= 8) return "text-brand-700";
  if (v >= 6) return "text-brand-600";
  if (v >= 4) return "text-brand-700";
  if (v >= 2) return "text-amber-700";
  return "text-coral-800";
}

export function parseBiasItem(text: string): { label: string; body: string } {
  const idx = text.indexOf(":");
  if (idx === -1) return { label: "Bias", body: text };
  return {
    label: text.slice(0, idx).trim(),
    body: text.slice(idx + 1).trim(),
  };
}
