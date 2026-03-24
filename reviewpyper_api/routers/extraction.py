from __future__ import annotations

from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from logic.extraction import evaluate_extraction
from models.extraction_models import ExtractionEvaluateRequest, ExtractionEvaluateResponse
from utils.errors import to_http_exception

router = APIRouter(prefix="/extraction", tags=["extraction"])


@router.post("/evaluate", response_model=ExtractionEvaluateResponse)
async def evaluate_extraction_endpoint(payload: ExtractionEvaluateRequest) -> ExtractionEvaluateResponse:
    try:
        result = await run_in_threadpool(
            evaluate_extraction,
            api_key_path=payload.api_key_path,
            csv_path=payload.csv_path,
            json_file_path=payload.json_file_path,
            keys_to_consider=payload.keys_to_consider,
            question=payload.question,
            model_choice=payload.model_choice,
            test_mode=payload.test_mode,
            answers_binary=payload.answers_binary,
            summary_type=payload.summary_type,
            master_list_path=payload.master_list_path,
        )
        return ExtractionEvaluateResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc
