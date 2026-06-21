import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network } from "vis-network/peer";
import { DataSet } from "vis-data/peer";
import type { Edge, Node, Options } from "vis-network/peer";
import { api } from "../api/client";
import type { GraphData } from "../api/types";

type ViewMode = "interactions" | "dependencies" | "full";
type LayoutKind = "ring" | "layers" | "force";

const MEGA_PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
];

const EDGE_KIND = {
  reinforcing: { color: "#15803d", label: "reinforcing", bg: "bg-green-100 text-green-800" },
  suppressing: { color: "#b91c1c", label: "suppressing", bg: "bg-red-100 text-red-800" },
  resource_competition: {
    color: "#b45309",
    label: "resource competition",
    bg: "bg-amber-100 text-amber-900",
  },
} as const;

function shortLabel(name: string, max = 24): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function ringPosition(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

function edgeKindStyle(kind: string) {
  if (kind === "reinforcing") return EDGE_KIND.reinforcing;
  if (kind === "suppressing") return EDGE_KIND.suppressing;
  return EDGE_KIND.resource_competition;
}

function buildGraph(
  data: GraphData,
  mode: ViewMode,
  minStrength: number,
  edgeFilters: Record<keyof typeof EDGE_KIND, boolean>
) {
  const visNodes: Node[] = [];
  const visEdges: Edge[] = [];
  const layerIds = new Map<string, string>();
  const pairCurve = new Map<string, number>();

  const addLayerNode = (layer: string, index: number, total: number) => {
    const key = layer.toLowerCase().trim();
    if (layerIds.has(key)) return layerIds.get(key)!;
    const id = `layer:${key}`;
    layerIds.set(key, id);
    const pos = ringPosition(index, total, 420);
    visNodes.push({
      id,
      label: shortLabel(layer, 20),
      title: layer,
      shape: "box",
      widthConstraint: { minimum: 90, maximum: 140 },
      margin: { top: 8, right: 8, bottom: 8, left: 8 },
      x: pos.x,
      y: pos.y,
      fixed: { x: true, y: true },
      color: { background: "#f8fafc", border: "#64748b" },
      font: {
        size: 12,
        color: "#334155",
        face: "Inter, system-ui, sans-serif",
        multi: false,
      },
      borderWidth: 1,
      group: "layer",
    });
    return id;
  };

  const showInteractions = mode === "interactions" || mode === "full";
  const showDependencies = mode === "dependencies" || mode === "full";

  const narrativeIds = new Set<string>();
  const megaNodes = data.nodes.filter((n) => n.kind === "mega");
  if (mode === "interactions") {
    megaNodes.forEach((n) => narrativeIds.add(n.id));
  } else {
    data.nodes.forEach((n) => narrativeIds.add(n.id));
  }

  const sortedNarratives = [...data.nodes]
    .filter((n) => narrativeIds.has(n.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const layout: LayoutKind =
    mode === "interactions"
      ? "ring"
      : mode === "dependencies"
      ? "layers"
      : "force";

  sortedNarratives.forEach((n, index) => {
    const isMega = n.kind === "mega";
    const paletteIndex = isMega
      ? megaNodes.findIndex((m) => m.id === n.id)
      : index % MEGA_PALETTE.length;
    const accent = MEGA_PALETTE[Math.max(0, paletteIndex) % MEGA_PALETTE.length];

    let x: number | undefined;
    let y: number | undefined;
    let fixed: Node["fixed"];

    if (layout === "ring") {
      const pos = ringPosition(index, sortedNarratives.length, 260);
      x = pos.x;
      y = pos.y;
      fixed = { x: true, y: true };
    } else if (layout === "layers" && isMega) {
      const pos = ringPosition(index, sortedNarratives.filter((x) => x.kind === "mega").length, 180);
      x = pos.x;
      y = pos.y - 80;
      fixed = { x: true, y: true };
    } else if (layout === "layers" && !isMega) {
      const pos = ringPosition(index, sortedNarratives.length, 120);
      x = pos.x;
      y = pos.y + 40;
      fixed = { x: true, y: true };
    }

    visNodes.push({
      id: n.id,
      label: shortLabel(n.name, isMega ? 22 : 18),
      title: n.name,
      shape: "dot",
      size: isMega ? 26 : 14,
      x,
      y,
      fixed,
      color: {
        background: isMega ? accent : "#e2e8f0",
        border: isMega ? "#0f172a" : "#64748b",
        highlight: { background: accent, border: "#0f172a" },
      },
      font: {
        size: isMega ? 12 : 10,
        color: "#0f172a",
        face: "Inter, system-ui, sans-serif",
        background: "rgba(255,255,255,0.96)",
        strokeWidth: 5,
        strokeColor: "rgba(255,255,255,0.96)",
        align: "center",
      },
      borderWidth: isMega ? 3 : 1,
      group: isMega ? "mega" : "sub",
    });
  });

  if (showInteractions) {
    data.interaction_edges.forEach((e, i) => {
      if (!narrativeIds.has(e.source) || !narrativeIds.has(e.target)) return;
      if ((e.strength ?? 1) < minStrength) return;
      const kindKey =
        e.kind === "reinforcing" || e.kind === "suppressing"
          ? e.kind
          : "resource_competition";
      if (!edgeFilters[kindKey]) return;

      const style = edgeKindStyle(e.kind);
      const pairKey = [e.source, e.target].sort().join("|");
      const curveIndex = pairCurve.get(pairKey) ?? 0;
      pairCurve.set(pairKey, curveIndex + 1);

      visEdges.push({
        id: `int-${i}`,
        from: e.source,
        to: e.target,
        arrows: { to: { enabled: true, scaleFactor: 0.55 } },
        color: { color: style.color, highlight: style.color, opacity: 0.78 },
        width: Math.max(1.2, Math.min(3.5, 0.8 + (e.strength ?? 1) / 3)),
        smooth: {
          enabled: true,
          type: curveIndex % 2 === 0 ? "curvedCW" : "curvedCCW",
          roundness: 0.18 + curveIndex * 0.08,
        },
        title: `${style.label}${e.description ? `: ${e.description}` : ""} (strength ${e.strength ?? "?"})`,
      });
    });
  }

  if (showDependencies) {
    const layers = [
      ...new Set(
        data.dependency_edges
          .map((e) => e.layer.trim())
          .filter(Boolean)
      ),
    ].sort();

    data.dependency_edges.forEach((e, i) => {
      if (!narrativeIds.has(e.source)) return;

      if (e.target && narrativeIds.has(e.target)) {
        visEdges.push({
          id: `dep-n-${i}`,
          from: e.source,
          to: e.target,
          arrows: { to: { enabled: true, scaleFactor: 0.45 } },
          color: { color: "#64748b", opacity: 0.45 },
          dashes: [5, 5],
          width: 1,
          smooth: { enabled: true, type: "continuous", roundness: 0.15 },
          title: e.layer,
        });
        return;
      }

      const layerIndex = layers.indexOf(e.layer.trim());
      const layerId = addLayerNode(
        e.layer,
        layerIndex >= 0 ? layerIndex : i,
        Math.max(layers.length, 1)
      );
      visEdges.push({
        id: `dep-l-${i}`,
        from: e.source,
        to: layerId,
        arrows: { to: { enabled: true, scaleFactor: 0.4 } },
        color: { color: "#94a3b8", opacity: 0.55 },
        dashes: [4, 6],
        width: Math.max(1, (e.weight ?? 1) / 4),
        smooth: { enabled: true, type: "continuous", roundness: 0.12 },
        title: `${e.layer} (${e.type})`,
      });
    });
  }

  return { nodes: visNodes, edges: visEdges, layout };
}

function networkOptions(layout: LayoutKind): Options {
  const staticLayout = layout === "ring" || layout === "layers";

  return {
    autoResize: true,
    layout: {
      improvedLayout: !staticLayout,
      hierarchical: false,
    },
    physics: staticLayout
      ? { enabled: false }
      : {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 100,
            updateInterval: 25,
            fit: true,
          },
          barnesHut: {
            gravitationalConstant: -6000,
            centralGravity: 0.15,
            springLength: 180,
            springConstant: 0.035,
            damping: 0.55,
            avoidOverlap: 0.35,
          },
        },
    interaction: {
      hover: true,
      tooltipDelay: 120,
      zoomView: true,
      dragView: true,
      dragNodes: !staticLayout,
      navigationButtons: false,
      hideEdgesOnDrag: false,
      multiselect: false,
    },
    nodes: {
      shadow: { enabled: true, size: 8, x: 0, y: 2, color: "rgba(15,23,42,0.12)" },
    },
    edges: {
      shadow: false,
      font: { size: 0, align: "middle" },
      selectionWidth: 2,
    },
  };
}

export default function DependencyGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const stabilizedRef = useRef(false);
  const [mode, setMode] = useState<ViewMode>("interactions");
  const [minStrength, setMinStrength] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stabilized, setStabilized] = useState(true);
  const [edgeFilters, setEdgeFilters] = useState({
    reinforcing: true,
    suppressing: true,
    resource_competition: true,
  });

  const graph = useQuery({ queryKey: ["graph"], queryFn: () => api.graph.get() });

  const graphPayload = useMemo(() => {
    if (!graph.data) return null;
    return buildGraph(graph.data, mode, minStrength, edgeFilters);
  }, [graph.data, mode, minStrength, edgeFilters]);

  const selectedNode = useMemo(() => {
    if (!graph.data || !selectedId || selectedId.startsWith("layer:")) return null;
    return graph.data.nodes.find((n) => n.id === selectedId) ?? null;
  }, [graph.data, selectedId]);

  const selectedConnections = useMemo(() => {
    if (!graph.data || !selectedId) return { outgoing: [], incoming: [] };
    const outgoing = graph.data.interaction_edges.filter((e) => e.source === selectedId);
    const incoming = graph.data.interaction_edges.filter((e) => e.target === selectedId);
    return { outgoing, incoming };
  }, [graph.data, selectedId]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    graph.data?.nodes.forEach((n) => map.set(n.id, n.name));
    return map;
  }, [graph.data]);

  useEffect(() => {
    setSelectedId(null);
  }, [mode]);

  useEffect(() => {
    if (!containerRef.current || !graphPayload) return;

    const staticLayout = graphPayload.layout !== "force";
    setStabilized(staticLayout);
    stabilizedRef.current = staticLayout;
    networkRef.current?.destroy();

    const finishLayout = () => {
      if (stabilizedRef.current) return;
      stabilizedRef.current = true;
      network.setOptions({ physics: { enabled: false } });
      network.fit({
        animation: { duration: 450, easingFunction: "easeInOutQuad" },
      });
      setStabilized(true);
    };

    const network = new Network(
      containerRef.current,
      {
        nodes: new DataSet(graphPayload.nodes),
        edges: new DataSet(graphPayload.edges),
      },
      networkOptions(graphPayload.layout)
    );

    network.on("selectNode", (params) => {
      setSelectedId(params.nodes[0] ?? null);
    });
    network.on("deselectNode", () => setSelectedId(null));
    network.on("click", (params) => {
      if (params.nodes.length === 0) setSelectedId(null);
    });

    if (staticLayout) {
      requestAnimationFrame(() => {
        network.fit({
          animation: { duration: 350, easingFunction: "easeInOutQuad" },
        });
      });
    } else {
      network.once("stabilizationIterationsDone", finishLayout);
      window.setTimeout(finishLayout, 3500);
    }

    networkRef.current = network;

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [graphPayload]);

  const fitGraph = () => {
    networkRef.current?.fit({
      animation: { duration: 350, easingFunction: "easeInOutQuad" },
    });
  };

  const counts = graphPayload
    ? { nodes: graphPayload.nodes.length, edges: graphPayload.edges.length }
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dependency & Interaction Graph
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "interactions"
              ? "Mega narratives in a fixed ring — click a node for details."
              : mode === "dependencies"
              ? "Narratives linked to infrastructure layers."
              : "Combined view — use filters to reduce clutter."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["interactions", "Interactions"],
              ["dependencies", "Dependencies"],
              ["full", "Full"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === key
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
          <button type="button" className="btn-ghost text-sm" onClick={fitGraph}>
            Fit view
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(Object.keys(EDGE_KIND) as (keyof typeof EDGE_KIND)[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              setEdgeFilters((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            className={`chip transition ${
              edgeFilters[key] ? EDGE_KIND[key].bg : "bg-slate-100 text-slate-400 line-through"
            }`}
          >
            {EDGE_KIND[key].label}
          </button>
        ))}
        <label className="ml-1 flex items-center gap-2 text-slate-500">
          Min strength
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={minStrength}
            onChange={(e) => setMinStrength(Number(e.target.value))}
            className="w-24 accent-brand-600"
          />
          <span className="w-4 font-medium text-slate-700">{minStrength}</span>
        </label>
        {counts && (
          <span className="text-slate-400">
            {counts.nodes} nodes · {counts.edges} edges
            {!stabilized && " · layout…"}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card relative h-[68vh] min-h-[420px] w-full overflow-hidden bg-slate-50">
          {graph.isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-slate-500">
              Loading graph…
            </div>
          )}
          <div ref={containerRef} className="h-full w-full" />
        </div>

        <aside className="card flex h-[68vh] min-h-[420px] flex-col overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Click a narrative node to inspect its links.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedNode ? (
              <div className="space-y-3 text-sm text-slate-500">
                <p>
                  Tip: toggle edge types above or raise <strong>Min strength</strong> to
                  hide weak links and reduce overlap.
                </p>
                <p>In <strong>Interactions</strong> mode, nodes stay on a fixed ring for readability.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {selectedNode.kind}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {selectedNode.name}
                  </h3>
                </div>

                {selectedConnections.outgoing.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Outgoing ({selectedConnections.outgoing.length})
                    </h4>
                    <ul className="space-y-2">
                      {selectedConnections.outgoing.map((e, i) => {
                        const style = edgeKindStyle(e.kind);
                        return (
                          <li
                            key={`out-${i}`}
                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                          >
                            <span className={`chip mr-2 ${style.bg}`}>{style.label}</span>
                            <span className="font-medium text-slate-800">
                              → {nameById.get(e.target) ?? "Unknown"}
                            </span>
                            {e.description && (
                              <p className="mt-1 text-slate-500">{e.description}</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {selectedConnections.incoming.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Incoming ({selectedConnections.incoming.length})
                    </h4>
                    <ul className="space-y-2">
                      {selectedConnections.incoming.map((e, i) => {
                        const style = edgeKindStyle(e.kind);
                        return (
                          <li
                            key={`in-${i}`}
                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                          >
                            <span className={`chip mr-2 ${style.bg}`}>{style.label}</span>
                            <span className="font-medium text-slate-800">
                              {nameById.get(e.source) ?? "Unknown"} →
                            </span>
                            {e.description && (
                              <p className="mt-1 text-slate-500">{e.description}</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {selectedConnections.outgoing.length === 0 &&
                  selectedConnections.incoming.length === 0 && (
                    <p className="text-sm text-slate-500">No interaction edges for this node.</p>
                  )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
