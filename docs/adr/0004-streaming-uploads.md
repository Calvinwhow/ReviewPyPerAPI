# ADR-0004: Streaming chunked CSV uploads with explicit size cap

**Status:** Accepted
**Date:** 2026-05-06

## Context

PubMed and similar reference exports for systematic reviews routinely
produce CSVs in the 50–300 MB range; some users have 500 MB+ corpora.
The previous upload path failed silently or hung for these files.
Three issues were stacked:

1. The frontend explicitly set `Content-Type: 'multipart/form-data'`
   on the axios request. axios respects an explicit Content-Type
   even on `FormData` payloads — meaning the **boundary parameter
   was missing** and the server received an unparseable body.
2. The `<FileUpload>` component advertised drag-and-drop in its label
   but had no `onDragOver`/`onDrop` handlers; only click-to-browse
   worked. The advertised `maxSizeMB` prop was destructured but unused.
3. The backend wrote uploads with a sync `shutil.copyfileobj` inside
   an async route, blocking the event loop for the duration of the
   write — fine for small files, lethal for 200 MB+.

The user had no progress indication during a multi-minute upload,
so it was indistinguishable from a hang.

## Decision

### Frontend
- Remove the explicit Content-Type header. axios sets the correct
  multipart boundary automatically when given a `FormData` instance.
- Rewrite `components/ui/FileUpload.tsx` with real `onDragOver`,
  `onDragLeave`, `onDrop` handlers and visible drag state.
- Honour the existing `maxSizeMB` prop with client-side validation
  (default 500 MB on upload pages).
- Wire axios `onUploadProgress` through `services/api.ts` and the
  `useUploadFile` hook to a `<ProgressBar>` in each upload page,
  with `role="status"` + `aria-live="polite"` so screen readers
  announce progress.

### Backend
- Stream uploads to disk in 1 MB chunks via
  `await anyio.open_file(...)` + `await file.read(UPLOAD_CHUNK_SIZE)`,
  keeping the event loop responsive.
- nginx already has `client_max_body_size 500m` and
  `proxy_request_buffering off` — keep them. If a deployment needs
  larger uploads, raise both via env in the Docker compose file
  rather than editing `nginx.conf` per-deploy.

### Validation
The 500 MB cap is enforced in three places:
1. **Frontend** — `FileUpload`'s `maxSizeMB` rejects oversized files
   before any bytes leave the browser.
2. **nginx** — `client_max_body_size` rejects oversized requests at
   the proxy.
3. **Implicit** — the API trusts validated requests; no separate cap
   is set in FastAPI.

## Consequences

### Positive

- Big CSVs upload reliably with visible progress.
- The event loop stays responsive during writes — other API requests
  aren't blocked.
- The user gets a meaningful error if they pick an oversized file
  (frontend) or somehow bypass the frontend (nginx 413).

### Negative

- The 500 MB cap is hardcoded in three places (frontend constant,
  nginx config, the `MAX_UPLOAD_MB` constant in upload pages). These
  need to stay in sync. Future work: surface the limit via
  `config.json` so all three derive from one source.

## Related

- `services/api.ts` — `filesApi.upload`
- `components/ui/FileUpload.tsx`
- `hooks/useApi.ts` — `useUploadFile`
- `reviewpyper_api/routers/files.py` — `upload_file`
- `reviewpyper_frontend/nginx.conf`
