# Cloudflare product insights

- Title: Workflows invocation clarity
  Problem: The API surface for starting workflows was not obvious from the quickstart docs, leading to trial-and-error.
  Suggestion: Add a “minimal start” snippet in the Workflows docs that shows the exact binding method to invoke a workflow from a Worker.

- Title: AI Search index visibility
  Problem: After seeding data, it was unclear whether the AI Search index was still warming or empty because of a config issue.
  Suggestion: Add an “index status” indicator in the AI Search dashboard that shows the latest ingest time and ready state.

- Title: Workers AI JSON enforcement
  Problem: Example prompts rarely show strict JSON-only outputs, which increases integration fragility for schema-driven workflows.
  Suggestion: Provide a documented JSON schema validation pattern with retries and fallback to reduce integration risk.

- Title: D1 migration ergonomics
  Problem: Migrations fail silently if the `migrations/` folder is misnamed or missing, causing confusing runtime errors.
  Suggestion: Wrangler should warn when migrations are expected but not found.

- Title: Local dev parity
  Problem: Local development can be blocked by OS constraints or missing bindings, forcing deploy-first debugging.
  Suggestion: Provide a “bindings simulation” mode or clearer dev container instructions in Workers docs.
