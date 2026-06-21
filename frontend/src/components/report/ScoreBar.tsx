import { formatLabel, scoreColor, scoreTextColor } from "./format";

interface Props {
  label: string;
  value: number;
  max?: number;
}

export default function ScoreBar({ label, value, max = 10 }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{formatLabel(label)}</span>
        <span className={`font-semibold tabular-nums ${scoreTextColor(value)}`}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
