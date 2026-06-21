import { Link } from "react-router-dom";

import { IconArrowRight } from "../components/icons/NavIcons";
import { appPath } from "../lib/routes";

const steps = [
  {
    num: "1",
    title: "Pick a narrative",
    body: "Choose a mega-theme or sub-theme from the catalog — AI, robotics, biotech, and more.",
  },
  {
    num: "2",
    title: "Read the report",
    body: "Each narrative gets a structured report: bottlenecks, winners, losers, and opportunities.",
  },
  {
    num: "3",
    title: "Compare & connect",
    body: "Use heatmaps and graphs to rank conviction and spot companies across themes.",
  },
];

const tools = [
  {
    to: appPath("/narratives"),
    title: "Narratives",
    body: "Browse all themes and open full research reports.",
  },
  {
    to: appPath("/heatmap"),
    title: "Scoring Heatmap",
    body: "Compare conviction scores side by side.",
  },
  {
    to: appPath("/companies"),
    title: "Company Heatmap",
    body: "See which companies win across multiple megas.",
  },
  {
    to: appPath("/graph"),
    title: "Dependency Graph",
    body: "Visualize how narratives link and reinforce each other.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-full bg-mist text-ink-900">
      <header className="border-b border-ink-100/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="group">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal-600">
              NIE
            </div>
            <div className="font-display text-xl text-ink-900 transition group-hover:text-signal-700">
              Narrative Intelligence
            </div>
          </Link>
          <Link to={appPath()} className="btn-ghost hidden sm:inline-flex">
            Open workspace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
        {/* Hero */}
        <section className="animate-fade-up text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-signal-600">
            Research workspace
          </p>
          <h1 className="mt-3 font-display text-balance text-4xl tracking-tight text-ink-900 sm:text-5xl">
            Understand market narratives in one place
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-ink-500">
            NIE tracks mega-themes and sub-themes, scores each one, and surfaces companies,
            bottlenecks, and investment angles — so you can compare themes without jumping
            between spreadsheets.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={appPath()} className="btn group">
              Open workspace
              <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#how-it-works" className="btn-ghost">
              How it works
            </a>
          </div>
          <p className="mt-4 text-xs text-ink-400">
            Research intelligence · not investment advice
          </p>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mt-16 sm:mt-20">
          <h2 className="text-center font-display text-2xl text-ink-900 sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-400">
            Three steps from theme to actionable view.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.num}
                className="rounded-xl border border-ink-100/70 bg-white p-5 shadow-card"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-signal-50 text-xs font-semibold text-signal-700">
                  {step.num}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink-800">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Tools */}
        <section className="mt-16 sm:mt-20">
          <h2 className="text-center font-display text-2xl text-ink-900 sm:text-3xl">
            What you can explore
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-400">
            The main views inside the workspace.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {tools.map((tool) => (
              <li key={tool.title}>
                <Link
                  to={tool.to}
                  className="group flex h-full flex-col rounded-xl border border-ink-100/70 bg-white p-5 shadow-card transition hover:border-signal-200 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink-800 group-hover:text-signal-700">
                      {tool.title}
                    </h3>
                    <IconArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-signal-600" />
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{tool.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-xl border border-ink-100/70 bg-white p-8 text-center shadow-card sm:mt-20">
          <h2 className="font-display text-2xl text-ink-900">Ready to explore?</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
            Open the workspace to browse narratives, heatmaps, and reports.
          </p>
          <Link to={appPath()} className="btn mt-6 inline-flex group">
            Enter workspace
            <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-ink-100/80 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-center text-xs text-ink-400 sm:text-left">
            Narrative Intelligence Engine · structured thematic research
          </div>
          <Link
            to={appPath()}
            className="text-sm font-medium text-signal-700 hover:text-signal-800"
          >
            Open workspace →
          </Link>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-ink-100/80 bg-white/95 p-3 backdrop-blur-sm sm:hidden">
        <Link to={appPath()} className="btn block w-full text-center">
          Open workspace
        </Link>
      </div>
    </div>
  );
}
