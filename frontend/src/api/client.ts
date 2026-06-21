import { PIPELINE_ENABLED, STATIC_DATA } from "../lib/features";
import { staticApi } from "./staticData";
import type {
  BottleneckOut,
  CompanyHeatmapData,
  GraphData,
  HeatmapData,
  JobOut,
  LifecycleMapData,
  NarrativeBrief,
  NarrativeDetail,
  OpportunityOut,
  ReportOut,
} from "./types";

const BASE = "/api";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function pipelineDisabled(): never {
  throw new Error("Pipeline is disabled in this deployment. Run synthesis locally and export data.");
}

export const api = {
  narratives: {
    list: (params?: Record<string, string>) =>
      STATIC_DATA
        ? staticApi.narratives.list(params)
        : jsonFetch<NarrativeBrief[]>(
            `/narratives${params ? "?" + new URLSearchParams(params).toString() : ""}`
          ),
    get: (slug: string) =>
      STATIC_DATA ? staticApi.narratives.get(slug) : jsonFetch<NarrativeDetail>(`/narratives/${slug}`),
    lifecycleMap: () =>
      STATIC_DATA
        ? staticApi.narratives.lifecycleMap()
        : jsonFetch<LifecycleMapData>("/narratives/lifecycle/map"),
  },
  reports: {
    get: (slug: string) =>
      STATIC_DATA ? staticApi.reports.get(slug) : jsonFetch<ReportOut>(`/reports/${slug}`),
  },
  graph: {
    get: (narrativeId?: string) =>
      STATIC_DATA
        ? staticApi.graph.get(narrativeId)
        : jsonFetch<GraphData>(`/graph${narrativeId ? `?narrative_id=${narrativeId}` : ""}`),
  },
  bottlenecks: {
    list: (tier?: string) =>
      STATIC_DATA
        ? staticApi.bottlenecks.list(tier)
        : jsonFetch<BottleneckOut[]>(`/bottlenecks${tier ? `?tier=${tier}` : ""}`),
  },
  opportunities: {
    list: (contrarian?: boolean) =>
      STATIC_DATA
        ? staticApi.opportunities.list(contrarian)
        : jsonFetch<OpportunityOut[]>(`/opportunities${contrarian ? "?contrarian=true" : ""}`),
    companyHeatmap: () =>
      STATIC_DATA
        ? staticApi.opportunities.companyHeatmap()
        : jsonFetch<CompanyHeatmapData>(`/opportunities/company-heatmap`),
  },
  scores: {
    heatmap: () =>
      STATIC_DATA ? staticApi.scores.heatmap() : jsonFetch<HeatmapData>(`/opportunities/heatmap`),
  },
  pipeline: {
    run: () => {
      if (!PIPELINE_ENABLED || STATIC_DATA) return Promise.reject(pipelineDisabled());
      return fetch(`${BASE}/pipeline/run`, { method: "POST" }).then(
        (r) => r.json() as Promise<JobOut>
      );
    },
    status: (id: string) => {
      if (!PIPELINE_ENABLED || STATIC_DATA) return Promise.reject(pipelineDisabled());
      return jsonFetch<JobOut>(`/pipeline/status/${id}`);
    },
  },
  kb: {
    upload: (file: File) => {
      if (STATIC_DATA) return Promise.reject(new Error("KB upload is not available in static mode."));
      const fd = new FormData();
      fd.append("file", file);
      return fetch(`${BASE}/kb/upload`, { method: "POST", body: fd }).then((r) => r.json());
    },
  },
};
