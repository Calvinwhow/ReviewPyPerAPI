from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class TitleScreenRequest(BaseModel):
    api_key_path: str
    csv_path: str
    question: str
    keywords_list: Optional[List[str]] = None
    model_choice: str = "gpt3_small"


class TitleScreenResponse(BaseModel):
    output_csv_path: str
