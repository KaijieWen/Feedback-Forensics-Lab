# Cloudflare bindings setup

This project expects the following bindings to be configured in the Cloudflare dashboard or via `wrangler.toml`.

## Required bindings

- **D1**: `DB` (database name: `ffl_db`)
- **R2**: `EVIDENCE_BUCKET` (bucket name: `ffl-evidence`)
- **Workers AI**: `AI`
- **Workflows**: `FFL_WORKFLOW` (class: `AnalyzeFeedbackWorkflow`)
- **AI Search**: `AI_SEARCH` (index name: `ffl-feedback`)
- **Static Assets**: `ASSETS` (served from `frontend/dist`)

## Optional vars

- `ADMIN_API_KEY`: If set, requests to `POST /api/retry/:id` must include header `x-ffl-admin-key`.
