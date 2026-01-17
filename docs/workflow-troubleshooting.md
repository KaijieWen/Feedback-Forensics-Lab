# Workflow Troubleshooting

## Current Issue

Workflows are failing to start with `workflow_start_failed` error. This prevents:
- Case files from being generated
- Clusters from being created
- Priority scores from being calculated

## Why This Happens

Cloudflare Workflows require a specific class structure pattern that may not match our current implementation. The workflow class needs to:
1. Be exported correctly from the Worker
2. Have the correct `run` method signature
3. Receive environment bindings properly

## Workaround: Direct Processing (For Demo)

While we investigate the Workflows issue, you can use a simplified version that processes feedback inline instead of using Workflows. This will still generate case files and clusters, just without the async workflow orchestration.

## Checking Workflow Status

1. Go to Cloudflare Dashboard → Workers & Pages → `ffl`
2. Click on "Workflows" tab
3. Check for any errors in the workflow execution logs
4. Verify the workflow binding is correctly configured

## Alternative: Manual Processing Endpoint

You could also add a manual trigger endpoint that processes a single feedback item inline (bypassing Workflows) to test the clustering functionality.
