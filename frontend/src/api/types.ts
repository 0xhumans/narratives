export interface NarrativeBrief {
  id: string;
  slug: string;
  name: string;
  kind: "mega" | "sub";
  parent_id: string | null;
  summary: string | null;
}

export interface NarrativeDetail extends NarrativeBrief {
  key_drivers: any[];
  adoption_curve: Record<string, any>;
  created_at: string;
  updated_at: string;
  children: NarrativeBrief[];
}

export interface HeatmapCell {
  narrative_id: string;
  slug: string;
  name: string;
  scores: Record<string, number>;
  composite: number;
}

export interface HeatmapData {
  factors: string[];
  rows: HeatmapCell[];
}

export interface CompanyHeatmapRow {
  company: string;
  company_key: string;
  ticker: string | null;
  scores: Record<string, number>;
  narrative_count: number;
  mega_count?: number;
  opportunity_count: number;
  composite: number;
  weighted_score?: number;
  rank?: number | null;
  megas: string[];
}

export interface CompanyHeatmapData {
  columns: { narrative_id: string; slug: string; name: string }[];
  rows: CompanyHeatmapRow[];
}

export interface LifecyclePhase {
  id: string;
  label: string;
  subtitle: string;
  order: number;
}

export interface LifecycleNarrativeItem {
  id: string;
  slug: string;
  name: string;
  kind: "mega" | "sub";
  mega_name: string;
  phase_id: string;
  stage_raw: string | null;
  composite: number;
  penetration_pct: number | null;
  is_leader: boolean;
}

export interface LifecycleMapData {
  phases: LifecyclePhase[];
  narratives: LifecycleNarrativeItem[];
}

export interface GraphData {
  nodes: { id: string; slug: string; name: string; kind: string }[];
  dependency_edges: {
    source: string;
    target: string | null;
    layer: string;
    type: string;
    weight: number;
    description: string | null;
  }[];
  interaction_edges: {
    source: string;
    target: string;
    kind: string;
    description: string | null;
    strength: number;
  }[];
}

export interface BottleneckOut {
  id: string;
  narrative_id: string;
  narrative_name: string;
  narrative_slug: string;
  mega_name: string;
  tier: "current" | "emerging" | "hidden";
  name: string;
  cause: string | null;
  severity: number;
  time_horizon: string | null;
  market_awareness: string | null;
  winners: any[];
  losers: any[];
}

export interface OpportunityOut {
  id: string;
  narrative_id: string;
  title: string;
  thesis: string | null;
  type: "direct" | "contrarian";
  awareness_gap: string | null;
  valuation_note: string | null;
  potential_winners: any[];
  potential_losers: any[];
}

export interface ReportOut {
  id: string;
  narrative_id: string;
  version: number;
  generated_at: string;
  payload: Record<string, any>;
}

export interface JobOut {
  id: string;
  status: string;
  total: number;
  done: number;
  current: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}
