"""Build a CSV inventory of every CLEF-TAR topic across 2017/2018/2019.

Walks the cloned clef-tar/ tree, extracts the topic ID and title from each
topic file, counts qrels rows per topic, and writes inventory.csv.

Run from the validation/ directory:
    python build_inventory.py
"""
from __future__ import annotations

import csv
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent / "clef-tar"
OUT = Path(__file__).parent / "inventory.csv"

TITLE_RE = re.compile(r"^Title:\s*(.+?)\s*$", re.MULTILINE)
TOPIC_RE = re.compile(r"^Topic:\s*(\S+)", re.MULTILINE)


def parse_topic_file(path: Path) -> tuple[str, str]:
    text = path.read_text(errors="ignore")
    topic_match = TOPIC_RE.search(text)
    title_match = TITLE_RE.search(text)
    topic_id = topic_match.group(1) if topic_match else path.name
    title = title_match.group(1) if title_match else ""
    return topic_id, title


def count_qrels(qrels_files: list[Path]) -> tuple[dict[str, int], dict[str, int]]:
    """Return (total_per_topic, included_per_topic)."""
    total: dict[str, int] = defaultdict(int)
    included: dict[str, int] = defaultdict(int)
    for qf in qrels_files:
        for line in qf.read_text(errors="ignore").splitlines():
            parts = line.split()
            if len(parts) < 4:
                continue
            tid, _, _pmid, rel = parts[:4]
            total[tid] += 1
            if rel == "1":
                included[tid] += 1
    return total, included


SOURCES = [
    # (year, task, review_type, split, topics_dir, qrels_dirs)
    ("2017", "Task2", "DTA", "train",
     "2017-TAR/training/topics_train",
     ["2017-TAR/training/qrels"]),
    ("2017", "Task2", "DTA", "test",
     "2017-TAR/testing/topics",
     ["2017-TAR/testing/qrels"]),
    ("2018", "Task2", "DTA", "train",
     "2018-TAR/Task2/Training/topics",
     ["2018-TAR/Task2/Training/qrels"]),
    ("2018", "Task2", "DTA", "test",
     "2018-TAR/Task2/Testing/topics",
     ["2018-TAR/Task2/Testing/qrels"]),
    ("2019", "Task2", "DTA", "train",
     "2019-TAR/Task2/Training/DTA/topics",
     ["2019-TAR/Task2/Training/DTA/qrels"]),
    ("2019", "Task2", "DTA", "test",
     "2019-TAR/Task2/Testing/DTA/topics",
     ["2019-TAR/Task2/Testing/DTA/qrels"]),
    ("2019", "Task2", "Intervention", "train",
     "2019-TAR/Task2/Training/Intervention/topics",
     ["2019-TAR/Task2/Training/Intervention/qrels"]),
    ("2019", "Task2", "Intervention", "test",
     "2019-TAR/Task2/Testing/Intervention/topics",
     ["2019-TAR/Task2/Testing/Intervention/qrels"]),
    ("2019", "Task2", "Prognosis", "test",
     "2019-TAR/Task2/Testing/Prognosis/topics",
     ["2019-TAR/Task2/Testing/Prognosis/qrels"]),
    ("2019", "Task2", "Qualitative", "test",
     "2019-TAR/Task2/Testing/Qualitative/topics",
     ["2019-TAR/Task2/Testing/Qualitative/qrels"]),
]


def main() -> None:
    rows: list[dict[str, object]] = []
    for year, task, rtype, split, topics_rel, qrels_rels in SOURCES:
        topics_dir = ROOT / topics_rel
        if not topics_dir.is_dir():
            print(f"skip (missing): {topics_dir}")
            continue
        qrels_files = []
        for qrel_rel in qrels_rels:
            qdir = ROOT / qrel_rel
            if qdir.is_dir():
                qrels_files.extend(p for p in qdir.iterdir() if p.is_file())
        total_map, included_map = count_qrels(qrels_files)
        for tf in sorted(topics_dir.iterdir()):
            if not tf.is_file():
                continue
            topic_id, title = parse_topic_file(tf)
            rows.append({
                "year": year,
                "task": task,
                "review_type": rtype,
                "split": split,
                "topic_id": topic_id,
                "title": title,
                "n_records": total_map.get(topic_id, 0),
                "n_included": included_map.get(topic_id, 0),
                "topic_file": str(tf.relative_to(Path(__file__).parent)),
            })

    rows.sort(key=lambda r: (r["year"], r["review_type"], r["split"], r["topic_id"]))
    with OUT.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} rows to {OUT}")


if __name__ == "__main__":
    main()
