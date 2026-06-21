# Static data snapshot (no secrets)

JSON files exported from the synthesis database for **read-only** deployment (Vercel / GitHub Pages).

## Update workflow

1. Run synthesis locally (`run_pipeline.bat` or `nie run`)
2. Export: **`export_data.bat`** (or `python backend/scripts/export_static_data.py`)
3. Commit `frontend/public/data/` and push to GitHub
4. Vercel rebuilds automatically

## Files

| File | Contents |
| --- | --- |
| `manifest.json` | Export timestamp + counts |
| `narratives.json` | All narrative briefs |
| `narratives/{slug}.json` | Narrative detail |
| `reports/{slug}.json` | Full synthesis report payload |
| `heatmap.json` | Scoring matrix |
| `company-heatmap.json` | Company junction matrix |
| `bottlenecks.json` | All bottlenecks |
| `opportunities.json` | Investment opportunities |
| `graph.json` | Dependency + interaction graph |
| `lifecycle-map.json` | Adoption lifecycle map |

Pipeline runs are **disabled** on Vercel (`VITE_PIPELINE_ENABLED=false`).
