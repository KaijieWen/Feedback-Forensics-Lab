# Runbook

## Deploy

1. Create D1 database and apply migrations.
2. Create R2 bucket (`ffl-evidence`).
3. Create AI Search index (`ffl-feedback`) pointing at the R2 bucket.
4. Configure Worker bindings (see `docs/bindings.md`).
5. Deploy Worker via `wrangler deploy`.

## Seed data

```sh
BASE_URL=https://your-worker.your-account.workers.dev npm run seed
```

## Smoke checks

- `POST /api/ingest` returns 202 with id.
- `GET /api/dashboard` returns top cases + clusters.
- `GET /api/search?q=cache` returns at least 1 result after seeding.
- Case view shows `ready` after workflow completes.

## Troubleshooting

- **Workflow stuck in processing**: check Workflows logs + D1 status.
- **AI Search empty**: index warming delay; seed early and retry.
- **AI JSON parse errors**: check Workers AI output; fallback should still populate case file.
- **Missing evidence**: verify R2 bucket permissions + object keys.
