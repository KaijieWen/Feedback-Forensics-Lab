# AI Search Setup Guide

This guide walks through setting up Cloudflare AI Search for the FFL prototype.

## Overview

AI Search (formerly AutoRAG) enables semantic similarity search over your R2-stored evidence documents. This allows FFL to:
- Find duplicate feedback automatically
- Cluster similar issues together
- Power the search UI with semantic matching

## Step-by-Step Setup

### Step 1: Create AI Search Index in Dashboard

1. **Navigate to Cloudflare Dashboard**
   - Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
   - Select your account

2. **Open AI Search**
   - Click **Workers & Pages** in the left sidebar
   - Click **AI Search** (or **AutoRAG** if you see that name)

3. **Create New Index**
   - Click **Create Index** or **Create RAG**
   - Name: `ffl-feedback`
   - Click **Create**

### Step 2: Configure Data Source (R2 Bucket)

1. **Select Data Source**
   - Choose **R2 Bucket** as your data source
   - Select bucket: `ffl-evidence`

2. **Configure Path Prefix**
   - **Path prefix**: `evidence/`
   - This tells AI Search to only index objects that start with `evidence/` in the bucket

3. **Configure File Types**
   - Select **JSON** files (since we store evidence as JSON)

4. **Save Configuration**
   - Click **Save** or **Continue**

### Step 3: Wait for Indexing

- Cloudflare will automatically start crawling and indexing your R2 bucket
- **Status**: Check the index status in the dashboard
- **Timing**: Initial indexing can take a few minutes depending on data size
- You'll see progress: "Indexing..." → "Ready"

### Step 4: Configure Workers Binding

AI Search bindings are configured via the Cloudflare Dashboard, not directly in `wrangler.toml`. However, you need to:

1. **Link to Your Worker**
   - Go to **Workers & Pages** → Your Worker (`ffl`)
   - Click **Settings** → **Variables and Secrets**
   - Scroll to **AI Search** section
   - Click **Add binding**
   - Select index: `ffl-feedback`
   - Binding name: `AI_SEARCH` (must match exactly)
   - Save

2. **Redeploy Your Worker** (if needed)
   ```bash
   npx wrangler deploy
   ```

   The binding should now be available as `env.AI_SEARCH` in your Worker code.

### Step 5: Verify AI Search is Working

1. **Test via Dashboard Playground** (if available)
   - Go back to AI Search → `ffl-feedback` index
   - Use the **Playground** or **Test** feature
   - Try a query like "slow loading times"
   - Should return relevant evidence documents

2. **Test via Your Worker**
   - Visit your Worker URL: `https://ffl.kaijiewen30.workers.dev`
   - Use the search box on the dashboard
   - Try searching for feedback you've ingested

3. **Check Worker Logs**
   ```bash
   npx wrangler tail
   ```
   - Ingest a feedback item
   - Watch for any AI Search errors in logs

### Step 6: Index Your Existing Evidence

If you already have evidence in R2, AI Search should automatically index it. To ensure everything is indexed:

1. **Check Index Status**
   - Dashboard → AI Search → `ffl-feedback` → **Overview**
   - Look for document count matching your R2 objects

2. **Trigger Re-indexing** (if needed)
   - Some indexes allow manual "Re-index" button
   - Or re-upload evidence files to trigger re-indexing

## Troubleshooting

### Issue: `env.AI_SEARCH` is `undefined`

**Solution**: 
- Verify the binding name is exactly `AI_SEARCH` in dashboard
- Redeploy worker after adding binding: `npx wrangler deploy`
- Check Worker settings → Bindings section shows AI Search

### Issue: Index shows "No results" or empty

**Possible causes**:
- Data source path is wrong (should be `evidence/`)
- R2 bucket permissions not set correctly
- Indexing still in progress (wait a few minutes)
- JSON files not formatted correctly

**Solution**:
- Verify R2 objects exist: `npx wrangler r2 bucket list ffl-evidence`
- Check object keys start with `evidence/`
- Verify JSON structure matches expected format

### Issue: Search returns wrong or no matches

**Solution**:
- Ensure documents in R2 are valid JSON
- Check that `text` field contains searchable content
- Try adjusting `match_threshold` in search queries (code uses default)
- Wait for indexing to complete (can take time for large datasets)

### Issue: "Indexing stuck" or never completes

**Solution**:
- Verify R2 bucket is accessible
- Check bucket name is correct (`ffl-evidence`)
- Ensure path prefix matches actual object keys
- Try creating a new index if the current one is stuck

## Expected Behavior

Once configured correctly:

1. **Ingest endpoint** (`POST /api/ingest`)
   - Stores evidence in R2
   - AI Search automatically indexes new files

2. **Workflow similarity search**
   - When processing feedback, workflow calls `env.AI_SEARCH.query()`
   - Returns similar feedback items
   - Used for clustering and deduplication

3. **Search endpoint** (`GET /api/search?q=...`)
   - Frontend search uses AI Search
   - Returns semantically similar feedback

## Code Reference

The code already handles AI Search gracefully:

- **If AI Search is not configured**: Returns empty results, app still works
- **If AI Search is configured**: Returns semantic matches

Check these files:
- `src/workflows/AnalyzeFeedbackWorkflow.ts` - Uses `findSimilar()` function
- `src/api/read.ts` - Search endpoint uses AI Search
- `src/types.ts` - `AI_SEARCH` is optional in `Env` interface

## Next Steps

After setting up AI Search:

1. **Seed sample data** to test:
   ```bash
   BASE_URL=https://ffl.kaijiewen30.workers.dev npm run seed
   ```

2. **Wait for indexing** (a few minutes)

3. **Test search functionality**:
   - Use dashboard search box
   - Check similarity results in case detail pages

4. **Verify clustering**:
   - Ingest duplicate feedback items
   - Check they get clustered together in the UI
