from __future__ import annotations
from pydantic import BaseModel

class PdfDownloadRequest(BaseModel):
    csv_path: str
    email: str
    allow_scihub: bool = True
    inclusion_column: str = "OpenAI_Screen_Abstract"

class PdfDownloadResponse(BaseModel):
    csv_path: str

class PdfPostProcessRequest(BaseModel):
    master_list_path: str
    pdf_dir: str = "PDFs"
    PMID_column: str = "PMID"
    pdf_name_column: str = "Title"

class PdfPostProcessResponse(BaseModel):
    master_list_path: str

class PdfOcrRequest(BaseModel):
    master_list_path: str
    page_threshold: int = 50
    output_dir: str | None = None

class PdfOcrResponse(BaseModel):
    output_dir: str
