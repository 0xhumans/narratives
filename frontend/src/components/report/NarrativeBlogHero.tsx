import { Link } from "react-router-dom";

import { getScoreColors } from "../../lib/heatmapColors";
import { titleFromSlug } from "../../lib/narrativeTheme";
import { appPath } from "../../lib/routes";
import { useNarrativeTheme } from "./NarrativeThemeContext";

export default function NarrativeBlogHero({
  slug,
  title,
  generatedAt,
  version,
  composite,
  conviction,
  narratives,
  onNavigate,
}: {
  slug: string;
  title?: string;
  generatedAt: string;
  version: number;
  composite?: number;
  conviction?: number;
  narratives: { slug: string; name: string }[];
  onNavigate: (slug: string) => void;
}) {
  const theme = useNarrativeTheme();
  const { Illustration } = theme;
  const displayTitle = title ?? titleFromSlug(slug);

  return (
    <header
      className="relative overflow-hidden rounded-2xl text-white shadow-lift"
      style={{
        background: `linear-gradient(135deg, ${theme.heroFrom} 0%, ${theme.heroTo} 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 90% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
        }}
      />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl">
          <Link
            to={appPath("/narratives")}
            className="inline-flex items-center gap-1 text-xs font-medium text-white/60 transition hover:text-white"
          >
            ← All narratives
          </Link>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
            Investment narrative brief
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]">
            {displayTitle}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
            {theme.tagline}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {(composite !== undefined || conviction !== undefined) && (
              <div className="flex flex-wrap gap-2">
                {composite !== undefined && (
                  <ScorePill label="Composite" value={composite} />
                )}
                {conviction !== undefined && (
                  <ScorePill label="Conviction" value={conviction} />
                )}
              </div>
            )}
            <span className="text-xs text-white/45">
              v{version} · {new Date(generatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 lg:items-end">
          <Illustration className="h-36 w-36 text-white/90 sm:h-44 sm:w-44" />
          <label className="w-full max-w-xs text-left lg:text-right">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Switch narrative
            </span>
            <select
              className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={slug}
              onChange={(e) => onNavigate(e.target.value)}
            >
              {narratives.map((n) => (
                <option key={n.slug} value={n.slug} className="text-ink-900">
                  {n.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const colors = getScoreColors(value);
  return (
    <div
      className="rounded-xl border px-4 py-2 backdrop-blur-sm"
      style={{
        backgroundColor: `${colors.bg}ee`,
        borderColor: colors.border,
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/80">{label}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: colors.text }}>
        {value.toFixed(1)}
        <span className="text-sm font-normal opacity-70">/10</span>
      </div>
    </div>
  );
}
