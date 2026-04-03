from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from logic.text import preprocess_text_dir
from models.text_models import TextPreprocessRequest, TextPreprocessResponse
from utils.errors import to_http_exception

router = APIRouter(prefix="/text", tags=["text"])


@router.post("/preprocess", response_model=TextPreprocessResponse)
async def preprocess_text_endpoint(payload: TextPreprocessRequest, test: bool = Query(False)) -> TextPreprocessResponse:
    if test:
        return TextPreprocessResponse(preprocessed_dir="/data/test_project/preprocessed_text")
    try:
        preprocessed_dir = await run_in_threadpool(preprocess_text_dir, payload.input_dir)
        return TextPreprocessResponse(preprocessed_dir=preprocessed_dir)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc
