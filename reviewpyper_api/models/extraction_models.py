from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel


class ExtractionEvaluateRequest(BaseModel):
    api_key_path: str
    csv_path: str
    json_file_path: str
    keys_to_consider: List[str]
    question: Dict[str, str]
    model_choice: str = "gpt4"
    test_mode: bool = False
    answers_binary: bool = False
    summary_type: str = "llm"
    master_list_path: str | None = None


class ExtractionEvaluateResponse(BaseModel):
    filtered_json_path: str
    evaluated_json_path: str
    raw_csv_path: str
    automated_csv_path: str
