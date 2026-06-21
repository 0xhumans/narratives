import type { ReactNode } from "react";

interface Props {
  title: string;
  children?: ReactNode;
  className?: string;
  wide?: boolean;
}

export default function ReportSection({ title, children, className = "", wide }: Props) {
  if (!children) return null;
  return (
    <article
      className={`rounded-2xl border border-ink-100/80 bg-white p-5 shadow-card transition hover:border-[rgb(var(--blog-accent-rgb)/0.25)] ${wide ? "lg:col-span-2" : ""} ${className}`}
    >
      <h3
        className="mb-4 text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--blog-accent)" }}
      >
        {title}
      </h3>
      {children}
    </article>
  );
}
