# Friction log

1. **Workers runtime on macOS** — Local dev tooling required macOS 13.5+, which blocked `create-cloudflare`. Needed to scaffold manually and rely on deploy-first workflow.
2. **AI Search bindings** — Binding names differ between docs and dashboard UI; required manual cross-check.
3. **Workflows start API** — Workflow invocation method names were not obvious without examples.
4. **R2 + AI Search linkage** — The UI made it unclear whether indexing is immediate or delayed; no “index warming” indicator.
5. **D1 migrations** — The path for migrations is easy to miss; no guardrails if the folder name is wrong.
6. **Workers AI JSON parsing** — Output variability requires strict validation and retry logic; docs examples were simple.
7. **Local vs deployed parity** — Some bindings are only available in deployed environments; local mock strategy is needed.
8. **Error messaging** — Missing binding errors during deploy are terse and require digging into logs.
9. **Docs scatter** — Workers AI, AI Search, and Workflows are in separate doc trees, making end-to-end setup time-consuming.
