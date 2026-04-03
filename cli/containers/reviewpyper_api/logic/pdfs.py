from __future__ import annotations
from ReviewPyper.calvin_utils.gpt_sys_review.pdf_utils import BulkPDFDownloaderV2, PdfPostProcess, OCROperator
from utils.paths import ensure_file_exists, normalize_path

def download_pdfs(csv_path: str, email: str, allow_scihub: bool = True, inclusion_column: str = "OpenAI_Screen_Abstract") -> str:
    csv_path = ensure_file_exists(csv_path)
    downloader = BulkPDFDownloaderV2(csv_path=csv_path, email=email, allow_scihub=allow_scihub, inclusion_column=inclusion_column)
    downloader.run()
    return csv_path

def postprocess_pdfs(master_list_path: str, pdf_dir: str = "PDFs", PMID_column: str = "PMID", pdf_name_column: str = "Title") -> str:
    master_list_path = ensure_file_exists(master_list_path)
    post_processor = PdfPostProcess(master_list_path=master_list_path, pdf_dir=pdf_dir, PMID_column=PMID_column, pdf_name_column=pdf_name_column)
    post_processor.run()
    return master_list_path

def ocr_pdfs(master_list_path: str, page_threshold: int = 50, output_dir: str | None = None) -> str:
    master_list_path = ensure_file_exists(master_list_path)
    if output_dir is not None:
        output_dir = normalize_path(output_dir)
    output_dir = OCROperator.extract_text_from_master_list(master_list_path, output_dir=output_dir, page_threshold=page_threshold)
    return output_dir
