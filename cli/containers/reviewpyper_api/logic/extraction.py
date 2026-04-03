from __future__ import annotations
from ReviewPyper.calvin_utils.gpt_sys_review.json_utils import FilterPapers, CustomSummarizer
from ReviewPyper.calvin_utils.gpt_sys_review.gpt_utils.openai_json_evaluator import OpenAIJsonEvaluator
from ReviewPyper.calvin_utils.gpt_sys_review.txt_utils import PostProcessing
from utils.paths import ensure_file_exists

def evaluate_extraction(api_key_path: str, csv_path: str, json_file_path: str, keys_to_consider: list[str], question: dict, model_choice: str = "gpt4", test_mode: bool = False, answers_binary: bool = False, summary_type: str = "llm", master_list_path: str | None = None) -> dict:
    api_key_path = ensure_file_exists(api_key_path)
    csv_path = ensure_file_exists(csv_path)
    json_file_path = ensure_file_exists(json_file_path)
    if master_list_path is not None:
        master_list_path = ensure_file_exists(master_list_path)
    filter_papers = FilterPapers(csv_path=csv_path, json_path=json_file_path)
    filtered_json_path = filter_papers.run()
    evaluator = OpenAIJsonEvaluator(api_key_path=api_key_path, json_file_path=filtered_json_path, keys_to_consider=keys_to_consider, question_type="extraction", question=question, model_choice=model_choice, test_mode=test_mode)
    answers = evaluator.evaluate_all_files()
    evaluated_json_path = evaluator.save_to_json(answers)
    summarizer = CustomSummarizer(json_path=evaluated_json_path, answers_binary=answers_binary, api_key_path=api_key_path, summary_type=summary_type)
    _, raw_path, automated_path = summarizer.run_custom()
    if master_list_path is not None:
        PostProcessing.add_raw_results_to_master_list(master_list_path=master_list_path, raw_results_path=raw_path)
    return {"filtered_json_path": filtered_json_path, "evaluated_json_path": evaluated_json_path, "raw_csv_path": raw_path, "automated_csv_path": automated_path}
