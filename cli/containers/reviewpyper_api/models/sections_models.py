from __future__ import annotations
from pydantic import BaseModel

class SectionLabelRequest(BaseModel):
    folder_path: str
    article_type: str
    api_key_path: str | None = None
    question: str | None = None

class SectionLabelResponse(BaseModel):
    json_dir: str
