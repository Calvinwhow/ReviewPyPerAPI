from __future__ import annotations

from typing import Optional, Sequence

import pandas as pd
from calvin_utils.gpt_sys_review.gpt_utils.openai_chat_base import OpenAIChatBase
from calvin_utils.gpt_sys_review.gpt_utils.title_screening import TitleScreener
from utils.paths import ensure_file_exists


class _PatchedTitleScreener(TitleScreener):
    """Work around a parameter-name mismatch in ReviewPyper: TitleScreener
    passes ``question=`` to OpenAIChatBase, which expects ``question_type=``."""

    def __init__(self, api_key_path, csv_path, question, model_choice="gpt3_small", keywords=None):
        self.csv_path = csv_path
        self.question = question
        self.keywords = keywords
        OpenAIChatBase.__init__(self, api_key_path=api_key_path, question_type=question, model_choice=model_choice)
        self.df = pd.read_csv(csv_path)


def screen_titles(
    api_key_path: str,
    csv_path: str,
    question: str,
    keywords_list: Optional[Sequence[str]] = None,
    model_choice: str = "gpt3_small",
) -> str:
    api_key_path = ensure_file_exists(api_key_path)
    csv_path = ensure_file_exists(csv_path)

    title_screening = _PatchedTitleScreener(
        api_key_path=api_key_path,
        csv_path=csv_path,
        question=question,
        keywords=keywords_list,
        model_choice=model_choice,
    )
    title_screening.run()
    output_path = csv_path.split(".")[0] + "_cleaned.csv"
    return output_path
