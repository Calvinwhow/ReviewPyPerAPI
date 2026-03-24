from __future__ import annotations

from ReviewPyper.calvin_utils.gpt_sys_review.txt_utils import TextPreprocessor
from utils.paths import ensure_dir_exists


def preprocess_text_dir(input_dir: str) -> str:
    input_dir = ensure_dir_exists(input_dir)
    preprocessor = TextPreprocessor(input_dir=input_dir)
    preprocessed_dir = preprocessor.process_files()
    return preprocessed_dir
