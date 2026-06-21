"""Parse and deduplicate winner/loser entity strings from synthesis."""
from __future__ import annotations

import re
from typing import Any

from nie.services.company_heatmap import _canonical_key, _company_head

_DASH_SEP = re.compile(r"\s[-–—]\s")


def parse_entity_entry(text: str) -> tuple[str, str]:
    """Split 'Name (reason)' or 'Name — reason' into display name + one-line rationale."""
    raw = str(text).strip()
    if not raw:
        return "", ""

    paren = re.match(r"^(.+?)\s*\(([^)]+)\)\s*$", raw)
    if paren:
        return paren.group(1).strip(), paren.group(2).strip()

    parts = _DASH_SEP.split(raw, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()

    return raw, ""


def _pick_reason(existing: str, new: str) -> str:
    if not existing:
        return new
    if not new:
        return existing
    if new in existing:
        return existing
    if existing in new:
        return new
    return f"{existing}; {new}"


def aggregate_entity_entries(items: Any) -> list[dict[str, str]]:
    """Flatten, dedupe by canonical company/entity key, merge reasons."""
    flat: list[str] = []
    if items is None:
        return []
    if isinstance(items, str):
        flat = [items]
    elif isinstance(items, dict) and "name" in items:
        return [{"name": str(items["name"]), "reason": str(items.get("reason") or "")}]
    elif isinstance(items, list):
        for x in items:
            if isinstance(x, str):
                flat.append(x)
            elif isinstance(x, dict) and x.get("name"):
                flat.append(
                    f"{x['name']} ({x['reason']})" if x.get("reason") else str(x["name"])
                )
            elif isinstance(x, list):
                flat.extend(str(y) for y in x if y)
            elif x:
                flat.append(str(x))

    merged: dict[str, dict[str, str]] = {}
    for raw in flat:
        name_part, reason = parse_entity_entry(raw)
        if not name_part:
            continue
        key, display, _ticker = _canonical_key(name_part)
        if not key:
            key = re.sub(r"[^a-z0-9]+", " ", name_part.lower()).strip() or name_part.lower()
        display = display or _company_head(name_part) or name_part
        if key in merged:
            merged[key]["reason"] = _pick_reason(merged[key]["reason"], reason)
            if len(display) < len(merged[key]["name"]):
                merged[key]["name"] = display
        else:
            merged[key] = {"name": display, "reason": reason}

    return list(merged.values())
