from __future__ import annotations

from pathlib import Path

from ReviewPyper.calvin_utils.gpt_sys_review.json_utils import SectionLabeler
from utils.paths import ensure_dir_exists


def label_sections(
    folder_path: str,
    article_type: str,
    api_key_path: str | None = None,
    question: str | None = None,
) -> str:
    folder_path = ensure_dir_exists(folder_path)

    if article_type == "other" and not question:
        raise ValueError("question is required when article_type is 'other'")
    if article_type in {"case", "other"} and not api_key_path:
        raise ValueError("api_key_path is required when article_type is 'case' or 'other'")

    section_labeler = SectionLabeler(
        folder_path=folder_path,
        article_type=article_type,
        api_key_path=api_key_path,
    )
    section_labeler.process_files(question=question)

    out_dir = str(Path(folder_path).parent / "json")
    return out_dir
