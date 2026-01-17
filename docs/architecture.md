# Architecture overview

FFL uses Cloudflare Workers as the API + UI host, backed by D1 (metadata), R2 (raw evidence), Workflows (async orchestration), Workers AI (case-file extraction), and AI Search (semantic similarity).

## Component diagram

```mermaid
flowchart LR
  user[User] --> ui[ReactUI]
  ui --> worker[WorkerAPI_UI]

  worker --> d1[(D1)]
  worker --> r2[(R2)]
  worker --> wf[Workflows]

  wf --> r2
  wf --> d1
  wf --> ai[WorkersAI]
  wf --> ais[AI_Search]
```

## Sequence flow

```mermaid
sequenceDiagram
  participant Client
  participant Worker
  participant D1
  participant R2
  participant WF as Workflows
  participant AIS as AI_Search
  participant AI as WorkersAI

  Client->>Worker: POST /api/ingest
  Worker->>D1: Insert feedback (queued)
  Worker->>R2: Store evidence JSON
  Worker->>WF: Start AnalyzeFeedbackWorkflow
  Worker-->>Client: 202 Accepted

  WF->>R2: Load evidence
  WF->>AIS: Query similar evidence
  WF->>AI: Generate case file JSON
  WF->>D1: Persist case file + cluster membership
  WF->>D1: Mark feedback ready
```

## Data model (D1)

- `feedback`: metadata + status + R2 pointer
- `case_file`: AI output JSON + priority + cluster
- `cluster`: cluster labels
- `cluster_member`: membership + similarity
- `similarity_edge`: semantic similarity links

## Required bindings

See [`docs/bindings.md`](docs/bindings.md). Capture a screenshot of the Workers bindings page for the submission PDF.
