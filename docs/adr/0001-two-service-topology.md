# ADR-0001: Two-service topology (frontend + ReviewPyper API)

**Status:** Accepted
**Date:** 2026-05-06

## Context

Earlier iterations of this project ran three services: a React frontend,
a thin gateway service for file management and request routing, and the
ReviewPyper API itself. The gateway was deleted in favour of folding its
responsibilities into the ReviewPyper API as routers + middleware.

The remaining two-directory layout (`reviewpyper_frontend/`,
`reviewpyper_api/`) is the project's load-bearing structural decision.

## Decision

Keep exactly two services:

- **`reviewpyper_frontend/`** — React 19 + Vite + Tailwind v4. Served
  in dev by Vite, in prod by nginx (which also reverse-proxies `/api/*`
  to the API container).
- **`reviewpyper_api/`** — FastAPI app that embeds ReviewPyper at build
  time via `git clone` and exposes the pipeline as routers
  (`titles`, `abstracts`, `pdfs`, `text`, `sections`, `inclusion`,
  `extraction`) plus a `files` router for upload / download / project
  state.

Do not introduce a third top-level service unless an ADR supersedes
this one. File management was already absorbed into the API; further
splitting must be justified.

## Consequences

### Positive

- One fewer process to deploy and monitor.
- File router and pipeline routers share the same `DATA_DIR`, no
  cross-service path coordination.
- Fewer Docker images, fewer compose files in lockstep.

### Negative

- The API serves both control-plane (file CRUD, state.json) and
  compute-plane (LLM-backed screening) traffic. If LLM jobs become
  long-running enough to need separate scaling, this ADR will need
  to be revisited.
- Changes to file management require redeploying the full API image.

## Operational rules

- The frontend communicates with the API via `/api/*`. Vite proxies
  this in dev (`vite.config.ts`); nginx proxies it in prod
  (`nginx.conf`).
- `DATA_DIR` is the storage seam. Both upload writes and pipeline
  reads go through it. Treat it as the persistent boundary; never
  leak host paths above it.
