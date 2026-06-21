"""Market data connector using yfinance. Returns summary context for tickers."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

log = logging.getLogger(__name__)

# Heuristic mapping of mega narrative slugs to representative ETFs/tickers.
NARRATIVE_TICKERS: dict[str, list[str]] = {
    "artificial-intelligence": ["BOTZ", "IRBO", "SMH"],
    "ai-memory-hbm-dram": ["MU", "000660.KS", "005930.KS"],
    "spiking-neural-networks": ["INTC", "IBM", "BRN.AX"],
    "robotics": ["BOTZ", "ROBO"],
    "nuclear-renaissance": ["NLR", "URA"],
    "defense-autonomy": ["ITA", "XAR"],
    "aging-population": ["IHI", "BBHI"],
    "climate-adaptation": ["ICLN", "SYLD"],
    "reindustrialization": ["VIS", "XLI"],
    "space-economy": ["UFO", "ARKS"],
    "biotechnology-revolution": ["IBB", "XBI"],
    "resource-scarcity": ["PICK", "REMX"],
}


async def fetch_market(slug: str) -> dict[str, Any]:
    """Fetch lightweight market summary for the narrative's representative tickers."""
    tickers = NARRATIVE_TICKERS.get(slug, [])
    if not tickers:
        return {}

    def _pull() -> dict[str, Any]:
        try:
            import yfinance as yf  # type: ignore
        except Exception as exc:  # noqa: BLE001
            log.warning("yfinance unavailable: %s", exc)
            return {}
        out: dict[str, Any] = {}
        for sym in tickers[:4]:
            try:
                info = yf.Ticker(sym).fast_info
                out[sym] = {
                    "last_price": getattr(info, "last_price", None),
                    "market_cap": getattr(info, "market_cap", None),
                }
            except Exception as exc:  # noqa: BLE001
                log.debug("yfinance %s failed: %s", sym, exc)
        return out

    try:
        return await asyncio.to_thread(_pull)
    except Exception as exc:  # noqa: BLE001
        log.warning("market fetch failed for '%s': %s", slug, exc)
        return {}
