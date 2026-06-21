import ReportSection from "./ReportSection";

interface Props {
  title: string;
  content?: string;
  items?: string[];
  /** Larger editorial body for thesis sections */
  lead?: boolean;
}

export default function ProseSection({ title, content, items, lead }: Props) {
  const hasItems = items && items.length > 0;
  if (!content && !hasItems) return null;

  return (
    <ReportSection title={title}>
      {content && (
        <p
          className={
            lead
              ? "text-base leading-relaxed text-ink-700 sm:text-[1.05rem] sm:leading-8"
              : "text-sm leading-relaxed text-ink-700"
          }
        >
          {content}
        </p>
      )}
      {hasItems && (
        <ul className={`space-y-3 ${content ? "mt-4" : ""}`}>
          {items!.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-700">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: "var(--blog-accent)" }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </ReportSection>
  );
}
