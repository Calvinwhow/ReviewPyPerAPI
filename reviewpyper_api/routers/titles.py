from __future__ import annotations

from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from logic.titles import screen_titles
from models.titles_models import TitleScreenRequest, TitleScreenResponse
from utils.errors import to_http_exception

router = APIRouter(prefix="/titles", tags=["titles"])


@router.post("/screen", response_model=TitleScreenResponse)
async def screen_titles_endpoint(payload: TitleScreenRequest) -> TitleScreenResponse:
    try:
        output_path = await run_in_threadpool(
            screen_titles,
            api_key_path=payload.api_key_path,
            csv_path=payload.csv_path,
            question=payload.question,
            keywords_list=payload.keywords_list,
            model_choice=payload.model_choice,
        )
        return TitleScreenResponse(output_csv_path=output_path)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc
