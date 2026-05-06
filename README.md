# ReviewPyPerAPI

A web application for AI-powered systematic literature reviews, built on top of [ReviewPyper](https://github.com/Calvinwhow/ReviewPyper).

## Architecture

The project is composed of two services:

| Service | Folder | Port | Description |
|---------|--------|------|-------------|
| **Frontend** | `reviewpyper_frontend/` | 5173 (dev) / 80 (prod) | React + TypeScript web UI |
| **ReviewPyper API** | `reviewpyper_api/` | 8000 | Core review logic, file management, and project lifecycle — title/abstract screening, data extraction, etc. |

```
User  →  Frontend  →  ReviewPyper API  →  OpenAI
                            ↕
                       File storage (/data)
```

File management and request routing previously handled by a separate gateway now live inside the API as `reviewpyper_api/routers/files.py` and `reviewpyper_api/middleware/`.

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Run the production stack

```bash
docker compose up --build
```

This builds and starts the ReviewPyper API on port 8000.

### Run the full stack (frontend + API) for development

```bash
export OPENAI_API_KEY=sk-...
docker compose -f docker-compose.dev.yml up --build
```

The real-OpenAI compose file (`docker-compose.real.yml`) is intended for end-to-end test runs against live OpenAI endpoints — see the E2E section below.

## Testing

All tests run in Docker — no local Node.js or Python required.

### Unit tests

```bash
# Frontend (Vitest)
docker compose -f docker-compose.test.yml run --rm frontend-unit
```

### E2E tests (synthetic — no API key needed)

```bash
docker compose -f docker-compose.test.yml up \
    --build --abort-on-container-exit --exit-code-from e2e \
    reviewpyper-api-e2e frontend-e2e e2e
```

### E2E tests (real — uses OpenAI tokens)

This runs the full pipeline against real OpenAI endpoints. **It costs real money** (a few cents per run with 3 test titles).

```bash
export OPENAI_API_KEY=sk-...
docker compose -f docker-compose.real.yml up --build \
    --abort-on-container-exit --exit-code-from playwright-real
```

#### Inspecting real test output

Output CSVs are stored in a Docker volume. To view them:

```bash
# List project folders
docker run --rm -v reviewpyperapi_shared-data:/data alpine ls -la /data/

# Copy output to your local machine
docker run --rm \
    -v reviewpyperapi_shared-data:/data \
    -v "$(pwd)":/out \
    alpine cp -r /data /out/output
```

## CI / CD

GitHub Actions runs automatically on every push to `main` and `new_v3`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** (`.github/workflows/ci.yml`) | Push / PR | Frontend unit tests and synthetic E2E |
| **Real E2E** (`.github/workflows/real-e2e.yml`) | Nightly (6 AM UTC) or manual | Full pipeline against OpenAI |

To enable the nightly real E2E, add your OpenAI API key as a repository secret named `OPENAI_API_KEY` in GitHub Settings → Secrets → Actions.

## Project Structure

```
ReviewPyPerAPI/
├── reviewpyper_api/           # ReviewPyper API service
│   ├── logic/                 # Business logic
│   ├── models/                # Pydantic schemas
│   ├── routers/               # FastAPI endpoints (incl. files.py)
│   ├── middleware/            # Request middleware (incl. test_mode.py)
│   ├── utils/                 # Helpers
│   ├── containers/            # Dockerfile
│   └── main.py                # Entry point
├── reviewpyper_frontend/      # React frontend
│   ├── src/                   # Application source
│   ├── e2e/                   # Playwright E2E tests
│   └── Dockerfile             # Production (nginx) build
├── docs/                      # Documentation (incl. ADRs)
├── validation/                # Benchmark validation harness
├── .github/workflows/         # CI/CD pipelines
├── docker-compose.yml         # Production API only
├── docker-compose.dev.yml     # Local dev stack (frontend + API)
├── docker-compose.test.yml    # Test suites
└── docker-compose.real.yml    # Full stack with real OpenAI
```
