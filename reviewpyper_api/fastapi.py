from fastapi import FastAPI
import sys
from pathlib import Path

_api_root = Path(__file__).resolve().parent
if str(_api_root) not in sys.path:
    sys.path.insert(0, str(_api_root))

from routers.titles import router as titles_router
from routers.abstracts import router as abstracts_router
from routers.pdfs import router as pdfs_router
from routers.text import router as text_router
from routers.sections import router as sections_router
from routers.inclusion import router as inclusion_router
from routers.extraction import router as extraction_router

app = FastAPI(title="ReviewPyper API")

app.include_router(titles_router)
app.include_router(abstracts_router)
app.include_router(pdfs_router)
app.include_router(text_router)
app.include_router(sections_router)
app.include_router(inclusion_router)
app.include_router(extraction_router)
