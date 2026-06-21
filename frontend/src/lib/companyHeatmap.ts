import type { CompanyHeatmapRow } from "../api/types";

export type NormalizedCompanyHeatmapRow = CompanyHeatmapRow & {
  mega_count: number;
  weighted_score: number;
  rank: number | null;
};

/** API rows before v2 used narrative_count as mega count only. */
function isLegacyRow(r: CompanyHeatmapRow): boolean {
  return r.mega_count == null && r.weighted_score == null;
}

function megaCountFromScores(r: CompanyHeatmapRow): number {
  return Object.values(r.scores).filter((v) => v > 0).length;
}

function normalizeCompanyRow(r: CompanyHeatmapRow): NormalizedCompanyHeatmapRow {
  const fromScores = megaCountFromScores(r);
  const legacy = isLegacyRow(r);

  const mega_count = r.mega_count ?? fromScores ?? r.narrative_count ?? 0;
  const narrative_count = legacy ? r.narrative_count : r.narrative_count ?? mega_count;
  const weighted_score = r.weighted_score ?? r.composite ?? 0;

  return {
    ...r,
    mega_count,
    narrative_count,
    weighted_score,
    rank: r.rank ?? null,
  };
}

export function normalizeCompanyRows(rows: CompanyHeatmapRow[]): NormalizedCompanyHeatmapRow[] {
  const normalized = rows.map(normalizeCompanyRow).filter((r) => r.mega_count >= 1);

  const needsRank = normalized.some((r) => r.ticker && r.rank == null);
  if (!needsRank) return normalized;

  const rankByKey = new Map<string, number>();
  let rank = 0;
  const byScore = [...normalized].sort(
    (a, b) =>
      b.weighted_score - a.weighted_score ||
      b.narrative_count - a.narrative_count ||
      b.mega_count - a.mega_count ||
      a.company.localeCompare(b.company, undefined, { sensitivity: "base" })
  );
  for (const r of byScore) {
    if (!r.ticker) continue;
    rank += 1;
    rankByKey.set(r.company_key, rank);
  }

  return normalized.map((r) => ({
    ...r,
    rank: r.rank ?? rankByKey.get(r.company_key) ?? null,
  }));
}

/** Strip redundant "(TICKER)" suffix when ticker is shown separately. */
export function displayCompanyName(name: string, ticker: string | null): string {
  if (!ticker) return name;
  const escaped = ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = name.replace(new RegExp(`\\s*\\(${escaped}\\)\\s*$`, "i"), "").trim();
  return stripped || name;
}
