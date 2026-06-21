import { getScoreColors } from "../lib/heatmapColors";

type Variant = "pill" | "heatmap" | "compact";

export default function ScoreCell({
  value,
  emphasized = false,
  compact = false,
  variant,
}: {
  value: number;
  emphasized?: boolean;
  compact?: boolean;
  variant?: Variant;
}) {
  const colors = getScoreColors(value);
  const display = value > 0 ? value.toFixed(1) : "—";
  const resolved: Variant = variant ?? (compact ? "compact" : "pill");

  if (resolved === "heatmap") {
    return (
      <div
        className={`flex h-7 w-full items-center justify-center rounded-md tabular-nums ${
          emphasized ? "text-[11px] font-semibold" : "text-[10px] font-medium"
        }`}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
        }}
        title={value > 0 ? `Score: ${display}` : undefined}
      >
        {display}
      </div>
    );
  }

  const sizeClass =
    resolved === "compact"
      ? `inline-flex min-w-0 items-center justify-center rounded-md border px-1 py-0.5 tabular-nums leading-none ${
          emphasized ? "text-[11px] font-semibold" : "text-[11px] font-medium"
        }`
      : `inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border px-1.5 py-0.5 tabular-nums leading-none ${
          emphasized ? "text-xs font-semibold" : "text-xs font-medium"
        }`;

  return (
    <span
      className={sizeClass}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {display}
    </span>
  );
}
