from __future__ import annotations
import os
from ReviewPyper.calvin_utils.gpt_sys_review.gpt_utils.openai_json_evaluator import OpenAIJsonEvaluator
from ReviewPyper.calvin_utils.gpt_sys_review.json_utils import InclusionExclusionSummarizer
from ReviewPyper.calvin_utils.gpt_sys_review.txt_utils import PostProcessing
from utils.paths import ensure_file_exists
from utils.csv import save_df

def evaluate_inclusion(api_key_path: str, json_file_path: str, keys_to_consider: list[str], question: dict, model_choice: str = "gpt3_small", test_mode: bool = True, master_list_path: str | None = None) -> dict:
    api_key_path = ensure_file_exists(api_key_path)
    json_file_path = ensure_file_exists(json_file_path)
    if master_list_path is not None:
        master_list_path = ensure_file_exists(master_list_path)
    evaluator = OpenAIJsonEvaluator(api_key_path=api_key_path, json_file_path=json_file_path, keys_to_consider=keys_to_consider, question_type="inclusion", question=question, model_choice=model_choice, test_mode=test_mode)
    answers = evaluator.evaluate_all_files()
    new_json_path = evaluator.save_to_json(answers)
    summarizer = InclusionExclusionSummarizer(new_json_path, questions=question)
    out_dir = os.path.dirname(new_json_path)
    raw_path = save_df(summarizer.df, out_dir, "inclusion_exclusion_results")
    dropped_df = summarizer.drop_rows_with_zeros()
    automated_path = save_df(dropped_df, out_dir, "inclusion_exclusion_results_dropped")
    if master_list_path is not None:
        PostProcessing.add_raw_results_to_master_list(master_list_path=master_list_path, raw_results_path=raw_path)
    return {"evaluated_json_path": new_json_path, "raw_csv_path": raw_path, "automated_csv_path": automated_path}
