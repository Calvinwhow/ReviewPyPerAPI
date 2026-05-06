# ADR-0002: Server `state.json` is the planned source of truth for project state

**Status:** Accepted
**Date:** 2026-05-06

## Context

Project state — review name, research question, review type, LLM config,
and the full `PipelineState` (paths to every intermediate artifact) — is
currently stored in **two places**:

1. **`localStorage`** under `reviewpyper_projects` (read/written via
   `hooks/useProjectState.ts`). Originally added when the frontend
   couldn't talk to a server.
2. **`<DATA_DIR>/<project_id>/state.json`** on the API server, accessed
   via the file router's `getProjectState` / `putProjectState` endpoints
   and the `useServerProjectState` hook.

This is a split-brain. The two stores can diverge (e.g. user clears
their browser data, or two browsers pin the same project). The
`useServerProjectState` hook was introduced for incremental migration —
its docstring explicitly says "kept for backwards compat — pages can
migrate to this hook one at a time."

## Decision

The server's `state.json` is the **planned source of truth** for project
state. Pages will migrate from `useProjectState` (localStorage) to
`useServerProjectState` (server) one at a time. localStorage is now
considered legacy.

### Migration rules going forward

- **New pages**: use `useServerProjectState` only.
- **Existing pages**: keep using `useProjectState` until explicitly
  migrated. Don't add new state shapes to localStorage that aren't
  already present.
- **Don't delete `useProjectState`** until every page has migrated and
  a back-fill / data-import path has been built for users with
  localStorage-only state.

This ADR does **not** mandate a migration deadline — it documents
direction so future architecture reviews don't re-suggest deleting
`useProjectState` prematurely.

## Consequences

### Positive

- A single, authoritative state location once migration completes.
- Multiple browsers / devices can resume the same review.
- Server-side backups become possible (`state.json` is just a file).

### Negative

- Pages that read state need to handle loading / error states
  (server reads are async, localStorage was sync).
- Until migration completes, both stores must be kept consistent
  by any code that creates a project (see `SetupReview.tsx`).

### Risks

- A user with localStorage-only state may lose context after migration.
  Mitigation: provide an "import from local" button on first server-
  state encounter, or auto-migrate on next project load.
