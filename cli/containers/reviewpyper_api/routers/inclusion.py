from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from logic.inclusion import evaluate_inclusion
from models.inclusion_models import InclusionEvaluateRequest, InclusionEvaluateResponse
from utils.errors import to_http_exception

router = APIRouter(prefix="/inclusion", tags=["inclusion"])


@router.post("/evaluate", response_model=InclusionEvaluateResponse)
async def evaluate_inclusion_endpoint(payload: InclusionEvaluateRequest, test: bool = Query(False)) -> InclusionEvaluateResponse:
    if test:
        return InclusionEvaluateResponse(
            evaluated_json_path="/data/test_project/inclusion_evaluated.json",
            raw_csv_path="/data/test_project/inclusion_exclusion_results.csv",
            automated_csv_path="/data/test_project/inclusion_exclusion_results_dropped.csv",
        )
    try:
        result = await run_in_threadpool(evaluate_inclusion, api_key_path=payload.api_key_path, json_file_path=payload.json_file_path, keys_to_consider=payload.keys_to_consider, question=payload.question, model_choice=payload.model_choice, test_mode=payload.test_mode, master_list_path=payload.master_list_path)
        return InclusionEvaluateResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc
