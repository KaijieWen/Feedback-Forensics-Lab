# Deployment Guide

This guide covers deploying FFL to Cloudflare Workers via the dashboard and GitHub Actions.

## Prerequisites

1. Cloudflare account with Workers enabled
2. Wrangler CLI installed: `npm install -g wrangler` (or use `npx wrangler`)
3. Authenticated with Cloudflare: `npx wrangler login`

## Step 1: Create Cloudflare Resources

### D1 Database

```bash
npx wrangler d1 create ffl_db
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ffl_db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### R2 Bucket

```bash
npx wrangler r2 bucket create ffl-evidence
```

### AI Search Index

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → AI Search
2. Create a new index named `ffl-feedback`
3. Configure it to index from the R2 bucket `ffl-evidence` (path: `evidence/`)

### Workflows

Workflows are automatically created when you deploy. Ensure your account has Workflows enabled.

## Step 2: Run Migrations

```bash
npx wrangler d1 execute ffl_db --file=./migrations/0001_init.sql
```

## Step 3: Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

## Step 4: Deploy

### Option A: Deploy via Wrangler CLI

```bash
npx wrangler deploy
```

### Option B: Deploy via GitHub Actions (Recommended)

1. Push your code to GitHub
2. In Cloudflare Dashboard → Workers & Pages → Your Worker → Settings → Add GitHub integration
3. Connect your repository
4. Enable "Deploy on push to main branch"

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Build the frontend
- Run migrations
- Deploy to Cloudflare

## Step 5: Seed Data (Optional)

After deployment, seed the database with sample feedback:

```bash
BASE_URL=https://ffl.YOUR_SUBDOMAIN.workers.dev npm run seed
```

Replace `YOUR_SUBDOMAIN` with your actual Workers subdomain.

## Step 6: Verify Deployment

1. Visit your Worker URL: `https://ffl.YOUR_SUBDOMAIN.workers.dev`
2. Check the dashboard loads
3. Try ingesting a feedback item
4. Verify the workflow processes it

## Troubleshooting

### Worker fails to start

- Check `wrangler.toml` has correct database_id
- Verify all bindings are configured in Cloudflare Dashboard
- Check Worker logs: `npx wrangler tail`

### Frontend not loading

- Ensure `frontend/dist` exists and was built
- Check `wrangler.toml` has `[assets]` section pointing to `./frontend/dist`
- Verify ASSETS binding is set

### Workflow not running

- Check Workflows are enabled in your account
- Verify workflow binding name matches `wrangler.toml`
- Check workflow logs in Cloudflare Dashboard

### AI Search not working

- Verify index exists and is connected to R2 bucket
- Check index has time to warm up (may take a few minutes after first upload)
- Ensure R2 objects are in `evidence/` path

## Environment Variables

If you need to set secrets (e.g., admin API keys), use:

```bash
npx wrangler secret put ADMIN_API_KEY
```

Then access via `env.ADMIN_API_KEY` in your Worker code.
