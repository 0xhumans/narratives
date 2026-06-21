import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import {
  IconBottleneck,
  IconClose,
  IconCompanies,
  IconDashboard,
  IconGraph,
  IconHeatmap,
  IconMenu,
  IconNarratives,
  IconOpportunity,
  IconPipeline,
} from "../components/icons/NavIcons";
import { PIPELINE_ENABLED } from "../lib/features";
import { appPath } from "../lib/routes";

type NavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

const primaryNav: NavItem[] = [
  { to: appPath(), label: "Dashboard", shortLabel: "Home", icon: IconDashboard, end: true },
  { to: appPath("/narratives"), label: "Narratives", shortLabel: "Stories", icon: IconNarratives },
  { to: appPath("/graph"), label: "Dependency Graph", shortLabel: "Graph", icon: IconGraph },
  { to: appPath("/heatmap"), label: "Scoring Heatmap", shortLabel: "Scores", icon: IconHeatmap },
  { to: appPath("/companies"), label: "Company Heatmap", shortLabel: "Companies", icon: IconCompanies },
];

const secondaryNav: NavItem[] = [
  { to: appPath("/bottlenecks"), label: "Bottlenecks", shortLabel: "Blocks", icon: IconBottleneck },
  { to: appPath("/opportunities"), label: "Opportunities", shortLabel: "Alpha", icon: IconOpportunity },
  ...(PIPELINE_ENABLED
    ? [{ to: appPath("/pipeline"), label: "Pipeline Console", shortLabel: "Pipeline", icon: IconPipeline }]
    : []),
];

const allNav = [...primaryNav, ...secondaryNav];

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-signal-50 text-signal-800 shadow-sm ring-1 ring-signal-100"
      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
  }`;
}

function mobileNavClass({ isActive }: { isActive: boolean }) {
  return `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition ${
    isActive ? "text-signal-700" : "text-ink-400"
  }`;
}

function isNavActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const currentPage =
    allNav.find((item) => isNavActive(pathname, item.to, item.end))?.label ?? "Workspace";

  return (
    <div className="flex min-h-full bg-mist">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100/80 bg-white lg:flex">
        <div className="border-b border-ink-50 px-5 py-6">
          <Link to="/" className="group block">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal-600">
              NIE
            </div>
            <div className="font-display text-xl leading-tight text-ink-900 transition group-hover:text-signal-700">
              Narrative Intelligence
            </div>
            <div className="text-xs text-ink-400">Research workspace</div>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-ink-300">
            Explore
          </div>
          {primaryNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <item.icon className="h-[18px] w-[18px] shrink-0 text-signal-500" />
              {item.label}
            </NavLink>
          ))}

          <div className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-wider text-ink-300">
            Analysis
          </div>
          {secondaryNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              <item.icon className="h-[18px] w-[18px] shrink-0 text-signal-500" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-50 px-5 py-4 text-xs text-ink-400">
          GLM-5.2 synthesis · Neon Postgres
        </div>
      </aside>

      {/* Mobile / tablet shell */}
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <Link to="/" className="font-display text-lg leading-none text-ink-900">
                NIE
              </Link>
              <div className="truncate text-xs text-ink-400">{currentPage}</div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-xl border border-ink-100 p-2.5 text-ink-600 transition hover:bg-ink-50"
              aria-label="Open navigation menu"
            >
              <IconMenu />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-24 lg:pb-0">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom dock */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-100/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-dock backdrop-blur-md lg:hidden"
          aria-label="Primary navigation"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5">
            {primaryNav.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileNavClass}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`rounded-xl p-1.5 ${isActive ? "bg-signal-50 text-signal-600" : "text-ink-400"}`}
                    >
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="truncate">{item.shortLabel}</span>
                  </>
                )}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`${mobileNavClass({ isActive: menuOpen })} border-0 bg-transparent`}
            >
              <span
                className={`rounded-xl p-1.5 ${menuOpen ? "bg-signal-50 text-signal-600" : "text-ink-400"}`}
              >
                <IconMenu className="h-5 w-5" />
              </span>
              <span>More</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-3xl bg-white shadow-lift animate-fade-up">
            <div className="flex items-center justify-between border-b border-ink-50 px-5 py-4">
              <div>
                <div className="font-display text-xl text-ink-900">Navigate</div>
                <div className="text-sm text-ink-400">All workspace views</div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-ink-100 p-2 text-ink-600"
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>
            <nav className="grid max-h-[60vh] gap-1 overflow-y-auto p-4 sm:grid-cols-2">
              {allNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0 text-signal-500" />
                  {item.label}
                </NavLink>
              ))}
              <Link
                to="/"
                className="col-span-full mt-2 flex items-center justify-center rounded-xl border border-dashed border-ink-200 px-4 py-3 text-sm font-medium text-ink-500 transition hover:border-signal-300 hover:text-signal-700"
                onClick={() => setMenuOpen(false)}
              >
                ← Back to landing
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
