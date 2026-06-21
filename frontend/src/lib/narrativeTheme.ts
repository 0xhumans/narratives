import type { ComponentType, SVGProps } from "react";

import {
  IconAging,
  IconAI,
  IconBio,
  IconClimate,
  IconCyber,
  IconDefense,
  IconElectrification,
  IconEnergy,
  IconGeneric,
  IconNuclear,
  IconReindustrial,
  IconResources,
  IconRobotics,
  IconSpace,
} from "../components/report/illustrations/NarrativeIllustrations";

export interface NarrativeTheme {
  slug: string;
  tagline: string;
  /** CSS color for accents */
  accent: string;
  accentRgb: string;
  heroFrom: string;
  heroTo: string;
  Illustration: ComponentType<SVGProps<SVGSVGElement>>;
}

const DEFAULT: NarrativeTheme = {
  slug: "default",
  tagline: "Structured thematic intelligence for long-horizon investors.",
  accent: "#0891b2",
  accentRgb: "8 145 178",
  heroFrom: "#0f172a",
  heroTo: "#164e63",
  Illustration: IconGeneric,
};

const THEMES: Record<string, Omit<NarrativeTheme, "slug">> = {
  "artificial-intelligence": {
    tagline: "From analytical AI to generative infrastructure — mapping the stack, the bottlenecks, and who captures value.",
    accent: "#6366f1",
    accentRgb: "99 102 241",
    heroFrom: "#0f0f23",
    heroTo: "#312e81",
    Illustration: IconAI,
  },
  "biotechnology-revolution": {
    tagline: "Gene editing, mRNA platforms, and AI drug discovery reshaping how medicine is invented and monetized.",
    accent: "#10b981",
    accentRgb: "16 185 129",
    heroFrom: "#022c22",
    heroTo: "#065f46",
    Illustration: IconBio,
  },
  "energy-transition-storage": {
    tagline: "Grids, storage, and clean electrons — the physical layer of decarbonization and its investable choke points.",
    accent: "#22c55e",
    accentRgb: "34 197 94",
    heroFrom: "#052e16",
    heroTo: "#166534",
    Illustration: IconEnergy,
  },
  "electrification-autonomous-mobility": {
    tagline: "EVs, charging networks, and autonomy stacks converging on a new mobility value chain.",
    accent: "#0ea5e9",
    accentRgb: "14 165 233",
    heroFrom: "#0c4a6e",
    heroTo: "#0369a1",
    Illustration: IconElectrification,
  },
  "cybersecurity-digital-trust": {
    tagline: "Zero trust, identity, and resilience as permanent capex — who wins when every breach is a headline.",
    accent: "#8b5cf6",
    accentRgb: "139 92 246",
    heroFrom: "#2e1065",
    heroTo: "#5b21b6",
    Illustration: IconCyber,
  },
  "defense-autonomy": {
    tagline: "Drones, autonomous systems, and defense tech in an era of geopolitical re-armament.",
    accent: "#64748b",
    accentRgb: "100 116 139",
    heroFrom: "#0f172a",
    heroTo: "#334155",
    Illustration: IconDefense,
  },
  "nuclear-renaissance": {
    tagline: "SMRs, fuel cycles, and baseload credibility returning to the energy conversation.",
    accent: "#f59e0b",
    accentRgb: "245 158 11",
    heroFrom: "#451a03",
    heroTo: "#92400e",
    Illustration: IconNuclear,
  },
  robotics: {
    tagline: "Humanoids, industrial automation, and the labor substitution curve hitting inflection.",
    accent: "#06b6d4",
    accentRgb: "6 182 212",
    heroFrom: "#083344",
    heroTo: "#155e75",
    Illustration: IconRobotics,
  },
  "space-economy": {
    tagline: "Launch costs down, constellations up — the orbital layer as industrial infrastructure.",
    accent: "#818cf8",
    accentRgb: "129 140 248",
    heroFrom: "#1e1b4b",
    heroTo: "#3730a3",
    Illustration: IconSpace,
  },
  "climate-adaptation": {
    tagline: "Physical risk, infrastructure hardening, and adaptation spend that markets still under-price.",
    accent: "#14b8a6",
    accentRgb: "20 184 166",
    heroFrom: "#042f2e",
    heroTo: "#0f766e",
    Illustration: IconClimate,
  },
  reindustrialization: {
    tagline: "Reshoring, advanced manufacturing, and supply-chain sovereignty as a multi-year capex wave.",
    accent: "#f97316",
    accentRgb: "249 115 22",
    heroFrom: "#431407",
    heroTo: "#9a3412",
    Illustration: IconReindustrial,
  },
  "resource-scarcity": {
    tagline: "Water, minerals, land, and rare earths — scarcity narratives with tangible pricing power.",
    accent: "#a16207",
    accentRgb: "161 98 7",
    heroFrom: "#292524",
    heroTo: "#78350f",
    Illustration: IconResources,
  },
  "aging-population": {
    tagline: "Demographics as destiny — healthcare, labor, and consumption shifts in aging societies.",
    accent: "#ec4899",
    accentRgb: "236 72 153",
    heroFrom: "#500724",
    heroTo: "#9d174d",
    Illustration: IconAging,
  },
};

export function getNarrativeTheme(slug: string | undefined): NarrativeTheme {
  if (!slug) return DEFAULT;
  const base = slug.replace(/-sub$/, "");
  const t = THEMES[base] ?? THEMES[slug];
  if (!t) return { ...DEFAULT, slug: base };
  return { slug: base, ...t };
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
