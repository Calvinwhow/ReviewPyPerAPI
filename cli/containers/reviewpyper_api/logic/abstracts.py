from __future__ import annotations
from typing import Optional, Sequence
from ReviewPyper.calvin_utils.gpt_sys_review.txt_utils import AbstractSeparator, TitleReviewFilter, PostProcessing
from ReviewPyper.calvin_utils.gpt_sys_review.gpt_utils.abstract_screening import AbstractScreener
from utils.paths import ensure_file_exists

def screen_abstracts(api_key_path: str, title_review_path: str, abstracts_txt_path: str, question: str, column_name: str = "OpenAI_Screen", model_choice: str = "gpt4", keywords: Optional[Sequence[str]] = None) -> dict:
    api_key_path = ensure_file_exists(api_key_path)
    title_review_path = ensure_file_exists(title_review_path)
    abstracts_txt_path = ensure_file_exists(abstracts_txt_path)
    separator = AbstractSeparator(abstracts_txt_path)
    _, abstracts_txt_path_preprocessed = separator.run()
    title_review_filter = TitleReviewFilter(title_review_path, abstracts_path=abstracts_txt_path_preprocessed, column_name=column_name)
    _, abstracts_txt_path_preprocessed_filtered = title_review_filter.run()
    abstract_screening = AbstractScreener(api_key_path=api_key_path, csv_path=abstracts_txt_path_preprocessed_filtered, question=question, model_choice=model_choice, keywords=keywords or [])
    screened_abstract_path = abstract_screening.run()
    post_processor = PostProcessing(file1_path=abstracts_txt_path_preprocessed, file2_path=screened_abstract_path, pubmed_csv_path=title_review_path)
    post_processor.run()
    master_list_path = post_processor.final_file_path
    return {"screened_abstract_path": screened_abstract_path, "master_list_path": master_list_path}
