from __future__ import annotations

from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from logic.abstracts import screen_abstracts
from models.abstracts_models import AbstractScreenRequest, AbstractScreenResponse
from utils.errors import to_http_exception

router = APIRouter(prefix="/abstracts", tags=["abstracts"])


@router.post("/screen", response_model=AbstractScreenResponse)
async def screen_abstracts_endpoint(payload: AbstractScreenRequest) -> AbstractScreenResponse:
    try:
        result = await run_in_threadpool(
            screen_abstracts,
            api_key_path=payload.api_key_path,
            title_review_path=payload.title_review_path,
            abstracts_txt_path=payload.abstracts_txt_path,
            question=payload.question,
            column_name=payload.column_name,
            model_choice=payload.model_choice,
            keywords=payload.keywords,
        )
        return AbstractScreenResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc
