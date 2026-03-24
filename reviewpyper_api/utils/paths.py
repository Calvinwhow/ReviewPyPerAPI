from __future__ import annotations

from pathlib import Path


def normalize_path(path: str) -> str:
    return str(Path(path).expanduser().resolve())


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
