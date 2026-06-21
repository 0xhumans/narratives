export type EntityEntry = { name: string; reason: string };

const TICKER_IN_PARENS = /\(\s*(?:[A-Z]{2,5}:)?([A-Z0-9]{1,5}(?:\.[A-Z]{1,2})?)\s*\)/g;

const SUFFIXES = [
  " incorporated",
  " inc.",
  " inc",
  " corp.",
  " corp",
  " corporation",
  " ltd.",
  " ltd",
  " limited",
  " plc",
  " co.",
  " co",
  " company",
  " group",
  " holdings",
  " electronics",
  " semiconductor",
  " semiconductors",
  " technology",
  " technologies",
];

function stripSuffix(name: string): string {
  let lowered = name.toLowerCase().trim();
  for (const suffix of SUFFIXES) {
    if (lowered.endsWith(suffix)) {
      return name.slice(0, -suffix.length).trim().replace(/[, ]+$/, "");
    }
  }
  return name.trim();
}

function companyHead(text: string): string {
  let head = text.split(/\s[-–—]\s/)[0]?.trim() ?? text;
  head = head.replace(TICKER_IN_PARENS, "");
  head = head.replace(/\([^)]*\)/g, "");
  head = head.replace(/\s+/g, " ").trim().replace(/[, .;]+$/, "");
  return stripSuffix(head);
}

function canonicalKey(namePart: string): string {
  const head = companyHead(namePart);
  const key = stripSuffix(head.toLowerCase());
  return key || namePart.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function parseEntityEntry(text: string): EntityEntry {
  const raw = text.trim();
  if (!raw) return { name: "", reason: "" };

  const paren = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    return { name: paren[1].trim(), reason: paren[2].trim() };
  }

  const dash = raw.split(/\s[-–—]\s/);
  if (dash.length >= 2) {
    return { name: dash[0].trim(), reason: dash.slice(1).join(" — ").trim() };
  }

  return { name: raw, reason: "" };
}

function pickReason(existing: string, next: string): string {
  if (!existing) return next;
  if (!next) return existing;
  if (existing.includes(next)) return existing;
  if (next.includes(existing)) return next;
  return `${existing}; ${next}`;
}

export function aggregateEntityEntries(items: unknown): EntityEntry[] {
  const flat: string[] = [];

  if (!items) return [];
  if (typeof items === "string") {
    flat.push(items);
  } else if (Array.isArray(items)) {
    for (const x of items) {
      if (typeof x === "string") flat.push(x);
      else if (x && typeof x === "object" && "name" in x) {
        const o = x as { name: string; reason?: string };
        flat.push(o.reason ? `${o.name} (${o.reason})` : o.name);
      } else if (Array.isArray(x)) {
        flat.push(...x.map(String).filter(Boolean));
      } else if (x) flat.push(String(x));
    }
  }

  const merged = new Map<string, EntityEntry>();
  for (const raw of flat) {
    const { name: namePart, reason } = parseEntityEntry(raw);
    if (!namePart) continue;
    const key = canonicalKey(namePart);
    const display = companyHead(namePart) || namePart;
    const prev = merged.get(key);
    if (prev) {
      merged.set(key, {
        name: display.length < prev.name.length ? display : prev.name,
        reason: pickReason(prev.reason, reason),
      });
    } else {
      merged.set(key, { name: display, reason });
    }
  }

  return [...merged.values()];
}
