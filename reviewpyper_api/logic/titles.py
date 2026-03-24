from __future__ import annotations

from typing import Optional, Sequence

from ReviewPyper.calvin_utils.gpt_sys_review.gpt_utils.title_screening import TitleScreener
from utils.paths import ensure_file_exists


def screen_titles(
    api_key_path: str,
    csv_path: str,
    question: str,
    keywords_list: Optional[Sequence[str]] = None,
    model_choice: str = "gpt3_small",
) -> str:
    api_key_path = ensure_file_exists(api_key_path)
    csv_path = ensure_file_exists(csv_path)

    title_screening = TitleScreener(
        api_key_path=api_key_path,
        csv_path=csv_path,
        question=question,
        keywords=keywords_list,
        model_choice=model_choice,
    )
    title_screening.run()
    output_path = csv_path.split(".")[0] + "_cleaned.csv"
    return output_path
