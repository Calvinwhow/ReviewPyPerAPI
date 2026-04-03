from __future__ import annotations
from typing import Dict, List
from pydantic import BaseModel

class InclusionEvaluateRequest(BaseModel):
    api_key_path: str
    json_file_path: str
    keys_to_consider: List[str]
    question: Dict[str, int]
    model_choice: str = "gpt3_small"
    test_mode: bool = True
    master_list_path: str | None = None

class InclusionEvaluateResponse(BaseModel):
    evaluated_json_path: str
    raw_csv_path: str
    automated_csv_path: str
