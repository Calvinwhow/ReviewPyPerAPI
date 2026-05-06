# Architecture Decision Records

Every significant architectural decision in ReviewPyPerAPI is recorded
here. These are the load-bearing decisions a future contributor (or
architecture review) needs to understand to avoid re-litigating settled
ground.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-two-service-topology.md) | Two-service topology (frontend + ReviewPyper API) | Accepted | 2026-05-06 |
| [0002](0002-server-state-as-source-of-truth.md) | Server `state.json` is the planned source of truth for project state | Accepted | 2026-05-06 |
| [0003](0003-editorial-design-direction.md) | Editorial / scientific-journal aesthetic for the frontend | Accepted | 2026-05-06 |
| [0004](0004-streaming-uploads.md) | Streaming chunked CSV uploads with explicit size cap | Accepted | 2026-05-06 |
| [0005](0005-managed-llm-credits.md) | Managed OpenAI / Anthropic credits with optional user-supplied key | Accepted | 2026-05-06 |

## Status values

- **Proposed** — under discussion
- **Accepted** — decision made, in effect
- **Deprecated** — no longer relevant
- **Superseded** — replaced by another ADR (link to the successor)

## Authoring a new ADR

1. Copy an existing ADR file as `NNNN-title-with-dashes.md`.
2. Fill in *Context*, *Decision*, *Consequences*. Keep it short
   (1–2 pages). Be honest about the trade-offs.
3. Add a row to the table above.
4. Submit as part of the PR that implements (or proposes) the decision.

## When to skip an ADR

Bug fixes, dependency bumps, formatting, refactors that don't change
the visible architecture. ADRs are for decisions a future contributor
might want to revisit or be confused by.
