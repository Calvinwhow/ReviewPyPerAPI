from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from logic.sections import label_sections
from models.sections_models import SectionLabelRequest, SectionLabelResponse
from utils.errors import to_http_exception

router = APIRouter(prefix="/sections", tags=["sections"])


@router.post("/label", response_model=SectionLabelResponse)
async def label_sections_endpoint(payload: SectionLabelRequest, test: bool = Query(False)) -> SectionLabelResponse:
    if test:
        return SectionLabelResponse(json_dir="/data/test_project/sections_json")
    try:
        json_dir = await run_in_threadpool(label_sections, folder_path=payload.folder_path, article_type=payload.article_type, api_key_path=payload.api_key_path, question=payload.question)
        return SectionLabelResponse(json_dir=json_dir)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc
