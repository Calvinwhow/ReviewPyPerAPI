from __future__ import annotations
from ReviewPyper.calvin_utils.gpt_sys_review.txt_utils import SectionLabeler
from utils.paths import ensure_dir_exists

def label_sections(folder_path: str, article_type: str, api_key_path: str | None = None, question: str | None = None) -> str:
    folder_path = ensure_dir_exists(folder_path)
    labeler = SectionLabeler(folder_path=folder_path, article_type=article_type, api_key_path=api_key_path, question=question)
    json_dir = labeler.run()
    return json_dir
