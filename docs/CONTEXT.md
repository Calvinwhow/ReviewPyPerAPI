# Domain Context

ReviewPyPerAPI wraps the [ReviewPyper](https://github.com/Calvinwhow/ReviewPyper)
research toolkit as a hosted web app for **automated systematic literature
reviews**. This file is the project's domain glossary — terminology used here
takes precedence inside the codebase, in PR descriptions, and in ADRs.

It is the input the `improve-codebase-architecture` skill uses to ground
deepening suggestions in the project's vocabulary instead of generic ones
("ReviewService", "DataHandler"). Update it as the model evolves.

---

## Core terms

### Review
A user's systematic literature review project. Has a research question,
review type (`standard` | `rapid` | `scoping`), and an associated
**Pipeline** of artifacts produced by each step.

### Pipeline
The 7-step flow that turns a corpus into structured data:

| Step | Name             | Input              | Output                                      |
|------|------------------|--------------------|---------------------------------------------|
| 1    | Setup            | research question  | `api_key_path`, project metadata            |
| 2    | Title Screening  | references CSV     | `title_output_csv_path`                     |
| 3    | Abstract Screening | abstracts file   | `screened_abstract_path`, `master_list_path`|
| 4    | PDF Processing   | master list        | `pdf_dir`, `ocr_output_dir`                 |
| 5    | Text & Sections  | OCR output         | `preprocessed_dir`, `json_dir`              |
| 6    | Inclusion        | section-labelled JSON | `inclusion_automated_csv_path`           |
| 7    | Extraction       | included papers    | `extraction_automated_csv_path`             |

### PipelineState
The bag of file paths and intermediate artifacts produced as a Review moves
through the Pipeline. Persisted at two layers (see ADR-0002):

- **localStorage** (legacy): keyed under `reviewpyper_projects`.
- **Server `state.json`** (target source of truth): in
  `<DATA_DIR>/<project_id>/state.json`, accessed via the file router's
  `getProjectState` / `putProjectState` endpoints.

### Provider
The LLM vendor used for the screening + extraction stages. Currently
`openai` or `anthropic`. The user can choose a provider per Review;
**managed credits** mean the server supplies an API key automatically
(via the `OPENAI_API_KEY` env var) so most users never touch raw keys.

### Adapter (file)
A user-uploaded artifact (CSV of references, TXT of abstracts, etc.)
consumed by the pipeline. Uploaded via the file router; persisted under
`<DATA_DIR>/<project_id>/`. Big CSVs (100s of MB) are common; uploads
stream chunked to disk (see ADR-0004).

---

## Service topology

Two services:

```
reviewpyper_frontend/   (React 19 + Vite, served via nginx in prod)
reviewpyper_api/        (FastAPI, embeds ReviewPyper from upstream git)
```

The frontend talks to the API via `/api/*`, proxied by nginx (prod) or
Vite (dev). There is no separate gateway service — file management lives
in `reviewpyper_api/routers/files.py`.

---

## Layout invariants

- The **two-directory shape** is load-bearing — see ADR-0001.
  Don't propose merging them or adding a third top-level service.
- The API embeds ReviewPyper at build time via `git clone` in
  `containers/Dockerfile.prod`. ReviewPyper is **not** an installable
  pip dependency.
- Project data lives in `DATA_DIR` (default `/data`, mounted as a
  Docker volume). Treat this directory as the long-term storage seam.
