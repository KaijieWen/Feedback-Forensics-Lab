# Feedback Forensics Lab (FFL)

FFL is a Cloudflare-native prototype that converts scattered user feedback into evidence-backed case files with semantic de-duplication and defensible prioritization.

## Stack

- **Workers**: API + UI host
- **D1**: feedback metadata + case files + clusters
- **R2**: immutable evidence storage
- **Workflows**: async analysis pipeline
- **Workers AI**: case-file extraction (JSON schema)
- **AI Search**: semantic de-duplication

## Key endpoints

- `POST /api/ingest`
- `GET /api/dashboard`
- `GET /api/case/:id`
- `GET /api/cluster/:id`
- `GET /api/search?q=`
- `POST /api/retry/:id` (admin-only)

## Local dev

```sh
npm install
npm --prefix frontend install
npm run build
npm run dev
```

If local dev fails due to `workerd` macOS constraints, use a Linux dev container or deploy directly to Cloudflare and test there.

## Seed data

```sh
BASE_URL=http://localhost:8787 npm run seed
```

## Deploy

See [`docs/deployment.md`](docs/deployment.md) for detailed deployment instructions.

### Quick Deploy

1. **Create Cloudflare resources:**
   ```sh
   npx wrangler d1 create ffl_db
   npx wrangler r2 bucket create ffl-evidence
   ```
   Update `wrangler.toml` with the database_id.

2. **Run migrations:**
   ```sh
   npx wrangler d1 execute ffl_db --file=./migrations/0001_init.sql
   ```

3. **Build and deploy:**
   ```sh
   cd frontend && npm run build && cd ..
   npx wrangler deploy
   ```

### GitHub Deployment

1. Push to GitHub:
   ```sh
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/ffl.git
   git push -u origin main
   ```

2. Set up GitHub Secrets:
   - `CLOUDFLARE_API_TOKEN`: Get from [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID`: Found in Workers & Pages → Overview

3. Enable GitHub Actions: The workflow will auto-deploy on push to `main`.

## Docs

- [`docs/architecture.md`](docs/architecture.md) - System architecture and design
- [`docs/deployment.md`](docs/deployment.md) - Detailed deployment guide
- [`docs/runbook.md`](docs/runbook.md) - Operations and troubleshooting
- [`docs/bindings.md`](docs/bindings.md) - Cloudflare bindings setup
- [`docs/friction-log.md`](docs/friction-log.md) - Build experience notes
- [`docs/product-insights.md`](docs/product-insights.md) - Cloudflare product feedback
- [`docs/demo.md`](docs/demo.md) - Demo script and walkthrough
