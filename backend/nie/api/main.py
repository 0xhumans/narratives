"""FastAPI application entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from nie.api.routers import (
    bottlenecks,
    graph,
    kb,
    narratives,
    opportunities,
    pipeline,
    reports,
)
from nie.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Narrative Intelligence Engine",
    version="0.1.0",
    description="Identify, model, analyze and forecast investment narratives.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


app.include_router(narratives.router)
app.include_router(reports.router)
app.include_router(graph.router)
app.include_router(bottlenecks.router)
app.include_router(opportunities.router)
app.include_router(pipeline.router)
app.include_router(kb.router)


# --- Serve the built React frontend (single-port deployment) ---------------
# main.py is at <repo>/backend/nie/api/main.py → repo root is parents[3]
FRONTEND_DIST = Path(__file__).resolve().parents[3] / "frontend" / "dist"
# index.html must not be cached — hashed /assets/* bundles change each build.
_SPA_INDEX_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
}
if FRONTEND_DIST.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="assets",
    )

    @app.get("/", include_in_schema=False)
    async def spa_root():
        return FileResponse(FRONTEND_DIST / "index.html", headers=_SPA_INDEX_HEADERS)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        # Don't shadow API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html", headers=_SPA_INDEX_HEADERS)
