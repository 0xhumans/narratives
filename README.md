# Narrative Intelligence Engine (NIE)

The Narrative Intelligence Engine maps investment mega-narratives, bottlenecks,
winners, and scores into an interactive research workspace.

## Architecture

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Neon Postgres
- **Frontend:** React 18, Vite, TypeScript, Tailwind
- **LLM (local only):** GLM via OpenRouter
- **Public deploy:** Static JSON snapshot on Vercel (no API keys in the browser)

## Local development

```bat
start.bat
```

Opens **http://127.0.0.1:8000** — API + UI on one port.

1. Copy `.env.example` → `backend/.env` and set `DATABASE_URL` + `GLM_API_KEY`
2. `nie seed` — narrative catalog
3. `run_pipeline.bat` — synthesis (local only)
4. `export_data.bat` — export DB → `frontend/public/data/` for GitHub/Vercel

## GitHub + Vercel deployment

### What goes to GitHub

- Source code + **`frontend/public/data/`** (exported reports, heatmaps, graph)
- **Never** commit `backend/.env`, API keys, or database passwords

### Update published data

1. Run synthesis locally (`run_pipeline.bat`)
2. Run **`export_data.bat`**
3. `git add frontend/public/data && git commit && git push`

### Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com)
2. Use the included **`vercel.json`** (builds `frontend/`, output `frontend/dist`)
3. No environment variables required for read-only mode (`frontend/.env.production` sets static data)

Pipeline runs are **disabled** on the public site. Synthesis stays on your machine.

## Repository layout

```
backend/           FastAPI + pipeline + export script
frontend/          React UI
frontend/public/data/   Static JSON snapshot (committed)
export_data.bat    Refresh data for GitHub/Vercel
vercel.json        Vercel build settings
```

## API (local backend)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/narratives` | List narratives |
| GET | `/api/reports/{slug}` | Latest report |
| GET | `/api/opportunities/heatmap` | Scoring matrix |
| POST | `/api/pipeline/run` | Synthesis (disabled when `PIPELINE_ENABLED=false`) |

## Conventions

- Secrets only via `backend/.env` — never committed
- Public site reads `/data/*.json` when `VITE_STATIC_DATA=true`
- Re-export data after each local synthesis batch
