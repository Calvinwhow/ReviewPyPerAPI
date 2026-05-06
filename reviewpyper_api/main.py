import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_api_root = Path(__file__).resolve().parent
if str(_api_root) not in sys.path:
    sys.path.insert(0, str(_api_root))

try:
    import ReviewPyper  # noqa: F401
except Exception as exc:
    raise RuntimeError(
        "ReviewPyper is not available. This API expects ReviewPyper to be installed "
        "via the Docker image build (git clone + PYTHONPATH)."
    ) from exc

from middleware.test_mode import TestModeMiddleware
from routers.files import router as files_router
from routers.titles import router as titles_router
from routers.abstracts import router as abstracts_router
from routers.pdfs import router as pdfs_router
from routers.text import router as text_router
from routers.sections import router as sections_router
from routers.inclusion import router as inclusion_router
from routers.extraction import router as extraction_router

app = FastAPI(title="ReviewPyper API")

# CORS origins are env-driven so prod deployments can override the local defaults.
# Set CORS_ORIGINS to a comma-separated list (e.g. "https://app.example.com,https://staging.example.com").
_default_origins = "http://localhost:5173,http://localhost:3000"
_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TestModeMiddleware)

app.include_router(files_router)
app.include_router(titles_router)
app.include_router(abstracts_router)
app.include_router(pdfs_router)
app.include_router(text_router)
app.include_router(sections_router)
app.include_router(inclusion_router)
app.include_router(extraction_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
