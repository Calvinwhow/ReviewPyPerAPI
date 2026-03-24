from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class AbstractScreenRequest(BaseModel):
    api_key_path: str
    title_review_path: str
    abstracts_txt_path: str
    question: str
    column_name: str = "OpenAI_Screen"
    model_choice: str = "gpt4"
    keywords: Optional[List[str]] = None


class AbstractScreenResponse(BaseModel):
    screened_abstract_path: str
    master_list_path: str
