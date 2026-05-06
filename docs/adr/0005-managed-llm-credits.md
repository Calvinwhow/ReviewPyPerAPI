# ADR-0005: Managed OpenAI / Anthropic credits with optional user-supplied key

**Status:** Accepted
**Date:** 2026-05-06

## Context

ReviewPyPerAPI is offered as a hosted service. Most users do not have
their own OpenAI or Anthropic API keys, and asking them to obtain one
before they can run their first review is a significant onboarding
friction. The team operates the service with shared credits funded
under the ReviewPyper account.

At the same time, sophisticated users (institutions with their own
billing, researchers running large extractions) want to override with
their own key — both for budget reasons and for compliance with their
institution's data-handling rules.

The pipeline supports both OpenAI and Anthropic providers via
`LLMConfig.provider`.

## Decision

### Provider abstraction

Treat `provider` as a first-class user choice. Surface it prominently
in `pages/SetupReview.tsx` as a radio group with both options
(`openai`, `anthropic`) and a short description of which models each
covers.

### Credit handling

Two paths, in order of precedence:

1. **Server-managed credits** (default).
   When the API container has `OPENAI_API_KEY` set in its environment,
   the file router's `create_project` endpoint writes that key to
   `<DATA_DIR>/<project_id>/api_key.txt` automatically. The frontend
   sees `api_key_path` in the create-project response and stores it
   in `pipeline_state.api_key_path`. The user never sees the key.
   The UI labels this state "Credits managed for you".

2. **User-supplied key** (override).
   The setup page exposes an optional password input. If the user
   pastes their own key, the frontend POSTs it to the file router's
   `saveApiKey` endpoint, which writes it to the same
   `api_key.txt` location, replacing the server-managed key for
   that project only.

### Anthropic parity

The current `OPENAI_API_KEY` env var is OpenAI-specific. When
provider switching becomes load-bearing for production traffic,
add a parallel `ANTHROPIC_API_KEY` and have `create_project` pick
based on the project's chosen provider. This is **deferred** until
ReviewPyper's pipeline routers natively support Anthropic models —
right now most pipeline calls assume OpenAI.

## Consequences

### Positive

- Onboarding is single-click for the common case.
- Power users keep an escape hatch.
- The pipeline code stays oblivious to who paid for the call —
  it just reads `api_key.txt`.

### Negative

- A leaked `api_key.txt` is more dangerous in this model than if each
  user supplied their own. Mitigation: `_safe_path` enforces that
  reads stay under `DATA_DIR` (see `routers/files.py`).
- Server-managed credits means the operator absorbs cost spikes from
  large reviews. Add per-project rate limiting before scaling broadly.

### Risks

- A bug that returns `api_key.txt` to the frontend would expose the
  shared credit key. The download endpoint allows arbitrary paths
  under `DATA_DIR`; a future ADR may want to restrict downloads to a
  whitelist of artifact types (CSVs, JSONs, etc.) excluding
  `api_key.txt` explicitly.
