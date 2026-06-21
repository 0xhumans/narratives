import type { ReactNode } from "react";

interface Props {
  id: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  wide?: boolean;
}

export default function BlogSection({ id, title, lead, children, wide }: Props) {
  if (!children) return null;

  return (
    <section id={id} className={`scroll-mt-24 ${wide ? "col-span-full" : ""}`}>
      <div className="mb-5 border-l-4 pl-4" style={{ borderColor: "var(--blog-accent)" }}>
        <h2 className="font-display text-xl text-ink-900 sm:text-2xl">{title}</h2>
        {lead && <p className="mt-1 max-w-3xl text-sm text-ink-500">{lead}</p>}
      </div>
      <div className={wide ? "" : "grid grid-cols-1 gap-4 lg:grid-cols-2"}>{children}</div>
    </section>
  );
}
