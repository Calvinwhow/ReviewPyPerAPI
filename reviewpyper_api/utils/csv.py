from __future__ import annotations

import os
import pandas as pd


def save_df(df: pd.DataFrame, out_dir: str, filename: str) -> str:
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{filename}.csv")
    df.to_csv(path)
    return path
