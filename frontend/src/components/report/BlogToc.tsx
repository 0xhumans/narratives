const SECTIONS = [
  { id: "thesis", label: "Thesis" },
  { id: "timing", label: "Timing" },
  { id: "structure", label: "Structure" },
  { id: "risks", label: "Risks" },
  { id: "effects", label: "Effects" },
  { id: "opportunities", label: "Opportunities" },
  { id: "score", label: "Score" },
  { id: "names", label: "Names" },
] as const;

export default function BlogToc() {
  return (
    <nav
      className="sticky top-0 z-20 -mx-1 mb-6 overflow-x-auto rounded-xl border border-ink-100/80 bg-white/95 px-2 py-2 shadow-sm backdrop-blur-md"
      aria-label="Report sections"
    >
      <ul className="flex min-w-max gap-1">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="inline-block rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-[rgb(var(--blog-accent-rgb)/0.08)] hover:text-[var(--blog-accent)]"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
