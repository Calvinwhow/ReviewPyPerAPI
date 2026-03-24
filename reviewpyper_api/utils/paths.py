from __future__ import annotations

import os
from pathlib import Path


def _default_data_root() -> Path:
    api_root = Path(__file__).resolve().parent.parent
    return api_root / "local_data"


def _data_root() -> Path:
    return Path(os.environ.get("DATA_DIR", str(_default_data_root()))).expanduser().resolve()


def normalize_path(path: str) -> str:
    candidate = Path(path).expanduser()
    if not candidate.is_absolute():
        candidate = _data_root() / candidate
    return str(candidate.resolve())


def ensure_file_exists(path: str) -> str:
    normalized = normalize_path(path)
    if not Path(normalized).is_file():
        raise FileNotFoundError(f"File not found: {normalized}")
    return normalized


def ensure_dir_exists(path: str) -> str:
    normalized = normalize_path(path)
    if not Path(normalized).is_dir():
        raise FileNotFoundError(f"Directory not found: {normalized}")
    return normalized
