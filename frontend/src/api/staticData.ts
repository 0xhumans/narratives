import type {
  BottleneckOut,
  CompanyHeatmapData,
  GraphData,
  HeatmapData,
  LifecycleMapData,
  NarrativeBrief,
  NarrativeDetail,
  OpportunityOut,
  ReportOut,
} from "./types";

const DATA = "/data";

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

let narrativesCache: NarrativeBrief[] | null = null;
async function allNarratives(): Promise<NarrativeBrief[]> {
  if (!narrativesCache) {
    narrativesCache = await loadJson<NarrativeBrief[]>(`${DATA}/narratives.json`);
  }
  return narrativesCache;
}

let graphCache: GraphData | null = null;
async function fullGraph(): Promise<GraphData> {
  if (!graphCache) graphCache = await loadJson<GraphData>(`${DATA}/graph.json`);
  return graphCache;
}

export const staticApi = {
  narratives: {
    list: async (params?: Record<string, string>) => {
      let rows = await allNarratives();
      if (params?.kind) rows = rows.filter((r) => r.kind === params.kind);
      if (params?.parent_id) rows = rows.filter((r) => r.parent_id === params.parent_id);
      return rows;
    },
    get: (slug: string) => loadJson<NarrativeDetail>(`${DATA}/narratives/${slug}.json`),
    lifecycleMap: () => loadJson<LifecycleMapData>(`${DATA}/lifecycle-map.json`),
  },
  reports: {
    get: (slug: string) => loadJson<ReportOut>(`${DATA}/reports/${slug}.json`),
  },
  graph: {
    get: async (narrativeId?: string) => {
      const g = await fullGraph();
      if (!narrativeId) return g;
      const id = narrativeId;
      return {
        nodes: g.nodes,
        dependency_edges: g.dependency_edges.filter(
          (e) => String(e.source) === id || String(e.target) === id
        ),
        interaction_edges: g.interaction_edges.filter(
          (e) => String(e.source) === id || String(e.target) === id
        ),
      };
    },
  },
  bottlenecks: {
    list: async (tier?: string) => {
      const rows = await loadJson<BottleneckOut[]>(`${DATA}/bottlenecks.json`);
      return tier ? rows.filter((b) => b.tier === tier) : rows;
    },
  },
  opportunities: {
    list: async (contrarian?: boolean) => {
      const rows = await loadJson<OpportunityOut[]>(`${DATA}/opportunities.json`);
      return contrarian ? rows.filter((o) => o.type === "contrarian") : rows;
    },
    companyHeatmap: () => loadJson<CompanyHeatmapData>(`${DATA}/company-heatmap.json`),
  },
  scores: {
    heatmap: () => loadJson<HeatmapData>(`${DATA}/heatmap.json`),
  },
};
