from __future__ import annotations
from pydantic import BaseModel

class TextPreprocessRequest(BaseModel):
    input_dir: str

class TextPreprocessResponse(BaseModel):
    preprocessed_dir: str
