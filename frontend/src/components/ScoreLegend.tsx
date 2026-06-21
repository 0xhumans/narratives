import { SCORE_GRADIENT, SCORE_LEGEND, getScoreColors } from "../lib/heatmapColors";

export default function ScoreLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      <div className="flex min-w-[10rem] flex-1 items-center gap-2 sm:max-w-xs">
        <span className="shrink-0 text-[10px] text-ink-400">Low</span>
        <div
          className="h-1.5 min-w-0 flex-1 rounded-full"
          style={{ background: SCORE_GRADIENT }}
          role="img"
          aria-label="Score color scale from weak to excellent"
        />
        <span className="shrink-0 text-[10px] text-ink-400">High</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {SCORE_LEGEND.map(({ label, min }) => {
          const colors = getScoreColors(min === 0.01 ? 1 : min);
          return (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-ink-500"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: colors.bg }}
                aria-hidden
              />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
