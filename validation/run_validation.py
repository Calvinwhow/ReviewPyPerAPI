"""End-to-end validation harness for ReviewPyper against CLEF-TAR.

Two subcommands:

  prep  — given a CLEF-TAR topic ID, fetches every paper in the topic from
          PubMed (titles + abstracts) and writes a CSV in the column shape
          ReviewPyper's title-screening pipeline expects. Upload that CSV
          via the app's Title Screening page and run screening as normal.

  score — given the screened CSV the app produces and the same topic ID,
          compares the AI's Include/Exclude decisions against the
          CLEF-TAR gold-standard qrels and prints recall, precision, F1,
          accuracy, and WSS@95 (Cohen's standard metric for screening
          tools — Work Saved over Sampling at 95% recall).

Usage examples:
    # 1) Build the input CSV for the smallest CLEF-TAR topic
    python validation/run_validation.py prep CD010355 \\
        --out /tmp/CD010355.csv --email you@example.com

    # 2) (Upload /tmp/CD010355.csv via the Title Screening page,
    #     run screening, then download the screened CSV from /data/)

    # 3) Score the screened output
    python validation/run_validation.py score \\
        --predictions screened.csv --topic CD010355

Dependencies: stdlib only (urllib, csv, xml.etree, json).
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INVENTORY = ROOT / "inventory.csv"

# NCBI rate limit without an API key: 3 req/s. We stay safely below.
PUBMED_DELAY_SEC = 0.4
EFETCH_BATCH = 200  # NCBI hard cap per efetch request
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


# ─────────────── inventory + qrels helpers ───────────────


def load_inventory_row(topic_id: str, year: str | None = None, split: str | None = None) -> dict[str, str]:
    """Return the inventory row matching the topic. Raises SystemExit if ambiguous."""
    candidates: list[dict[str, str]] = []
    with INVENTORY.open() as f:
        for row in csv.DictReader(f):
            if row["topic_id"] != topic_id:
                continue
            if year and row["year"] != year:
                continue
            if split and row["split"] != split:
                continue
            candidates.append(row)
    if not candidates:
        sys.exit(f"topic not found in inventory: {topic_id} (year={year}, split={split})")
    if len(candidates) > 1:
        opts = ", ".join(f"{r['year']}/{r['split']}" for r in candidates)
        sys.exit(
            f"topic {topic_id} appears in multiple slices: {opts}\n"
            f"add --year and/or --split to disambiguate"
        )
    return candidates[0]


def find_qrels_files(year: str, split: str, review_type: str) -> list[Path]:
    """Return every qrels file that could contain rows for the given slice."""
    base = ROOT / "clef-tar"
    candidates: list[Path] = []
    if year == "2017":
        if split == "train":
            candidates.append(base / "2017-TAR/training/qrels/train.clef2017.qrels")
        else:
            qdir = base / "2017-TAR/testing/qrels"
            if qdir.is_dir():
                candidates.extend(qdir.iterdir())
    elif year == "2018":
        seg = "Training" if split == "train" else "Testing"
        qdir = base / f"2018-TAR/Task2/{seg}/qrels"
        if qdir.is_dir():
            candidates.extend(qdir.iterdir())
    elif year == "2019":
        seg = "Training" if split == "train" else "Testing"
        qdir = base / f"2019-TAR/Task2/{seg}/{review_type}/qrels"
        if qdir.is_dir():
            candidates.extend(qdir.iterdir())
    return [c for c in candidates if c.is_file()]


def load_qrels(topic_id: str, qrels_files: list[Path]) -> dict[str, int]:
    """Return {pmid: 0|1} for the given topic across the supplied qrels files.

    qrels rows are TAB-or-space separated: <topic-id>\\t0\\t<pmid>\\t<rel>
    Some files have separate abstract-level vs document-level judgments —
    we use abstract-level (which matches title/abstract screening).
    """
    abs_only = [p for p in qrels_files if "abs" in p.name or "abstract" in p.name]
    files = abs_only if abs_only else qrels_files
    labels: dict[str, int] = {}
    for qf in files:
        for line in qf.read_text(errors="ignore").splitlines():
            parts = line.split()
            if len(parts) < 4:
                continue
            tid, _, pmid, rel = parts[:4]
            if tid != topic_id:
                continue
            labels[pmid] = max(labels.get(pmid, 0), int(rel))
    return labels


# ─────────────── PubMed E-utilities ───────────────


def _http_get_with_retry(url: str, max_retries: int = 5) -> bytes:
    """GET with exponential backoff for 429 / 503."""
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 503):
                wait = (2 ** attempt) * 1.0
                print(f"    {exc.code} — backing off {wait:.1f}s (attempt {attempt + 1}/{max_retries})", file=sys.stderr)
                time.sleep(wait)
                last_exc = exc
                continue
            raise
        except urllib.error.URLError as exc:
            wait = (2 ** attempt) * 1.0
            print(f"    URL error — backing off {wait:.1f}s ({exc})", file=sys.stderr)
            time.sleep(wait)
            last_exc = exc
    raise RuntimeError(f"PubMed fetch failed after {max_retries} retries") from last_exc


def fetch_pubmed_records(pmids: list[str], email: str, tool: str = "ReviewPyperAPI-validation") -> dict[str, dict[str, str]]:
    """Fetch title / abstract / authors / year / journal / DOI for each PMID.

    Returns {pmid: {"Title": ..., "Abstract": ..., ...}}. Missing PMIDs
    (deleted records, etc.) are simply absent from the result.
    """
    out: dict[str, dict[str, str]] = {}
    total_batches = (len(pmids) + EFETCH_BATCH - 1) // EFETCH_BATCH
    for batch_idx in range(0, len(pmids), EFETCH_BATCH):
        batch = pmids[batch_idx : batch_idx + EFETCH_BATCH]
        params = urllib.parse.urlencode({
            "db": "pubmed",
            "id": ",".join(batch),
            "retmode": "xml",
            "rettype": "abstract",
            "tool": tool,
            "email": email,
        })
        url = f"{EFETCH_URL}?{params}"
        which = (batch_idx // EFETCH_BATCH) + 1
        print(f"  efetch batch {which}/{total_batches} ({len(batch)} PMIDs)…", file=sys.stderr)
        body = _http_get_with_retry(url)
        out.update(_parse_efetch_xml(body))
        time.sleep(PUBMED_DELAY_SEC)
    return out


def _xml_text(elem: ET.Element | None) -> str:
    if elem is None:
        return ""
    # Concatenate text + tail of every descendant — handles abstracts with
    # nested <i>, <sup>, <sub> tags that PubMed uses for italics, formulae.
    return "".join(elem.itertext()).strip()


def _parse_efetch_xml(body: bytes) -> dict[str, dict[str, str]]:
    """Parse a PubmedArticleSet response into {pmid: {fields}}."""
    out: dict[str, dict[str, str]] = {}
    root = ET.fromstring(body)
    for article in root.iter("PubmedArticle"):
        try:
            pmid_el = article.find(".//MedlineCitation/PMID")
            if pmid_el is None or not (pmid_el.text or "").strip():
                continue
            pmid = (pmid_el.text or "").strip()

            title = _xml_text(article.find(".//ArticleTitle"))

            # Abstract may be split across multiple <AbstractText> nodes
            # (Background:, Methods:, Results:, Conclusion:).
            abstract_parts: list[str] = []
            for at in article.findall(".//Abstract/AbstractText"):
                label = at.attrib.get("Label")
                text = _xml_text(at)
                if label and text:
                    abstract_parts.append(f"{label}: {text}")
                elif text:
                    abstract_parts.append(text)
            abstract = " ".join(abstract_parts)

            year = _xml_text(article.find(".//PubDate/Year")) or _xml_text(article.find(".//PubDate/MedlineDate"))
            year = year[:4] if year else ""
            journal = _xml_text(article.find(".//Journal/Title")) or _xml_text(article.find(".//Journal/ISOAbbreviation"))

            authors_list: list[str] = []
            for au in article.findall(".//AuthorList/Author"):
                last = _xml_text(au.find("LastName"))
                inits = _xml_text(au.find("Initials"))
                if last:
                    authors_list.append(f"{last} {inits}".strip())
            authors = ", ".join(authors_list)

            doi = ""
            for art_id in article.findall(".//ArticleIdList/ArticleId"):
                if art_id.attrib.get("IdType") == "doi":
                    doi = _xml_text(art_id)
                    break

            out[pmid] = {
                "PMID": pmid,
                "Title": title,
                "Authors": authors,
                "Year": year,
                "Journal": journal,
                "Abstract": abstract,
                "DOI": doi,
            }
        except (ET.ParseError, ValueError, AttributeError) as exc:
            print(f"    parse error: {exc}", file=sys.stderr)
            continue
    return out


# ─────────────── prep subcommand ───────────────


CSV_COLUMNS = ["PMID", "Title", "Authors", "Year", "Journal", "Abstract", "DOI", "_GoldStandard"]


def cmd_prep(args: argparse.Namespace) -> int:
    row = load_inventory_row(args.topic, args.year, args.split)
    print(f"topic: {row['topic_id']} ({row['year']} / {row['review_type']} / {row['split']})", file=sys.stderr)
    print(f"title: {row['title']}", file=sys.stderr)

    qrels_files = find_qrels_files(row["year"], row["split"], row["review_type"])
    if not qrels_files:
        sys.exit(f"no qrels files found for {row['year']}/{row['split']}/{row['review_type']}")
    labels = load_qrels(row["topic_id"], qrels_files)
    if not labels:
        sys.exit(f"no qrels rows found for topic {row['topic_id']}")

    pmids = sorted(labels.keys(), key=int)
    if args.max_pmids and args.max_pmids < len(pmids):
        # Stratified sample so we keep both included and excluded examples.
        pos = [p for p in pmids if labels[p] == 1][: args.max_pmids // 4 + 1]
        neg = [p for p in pmids if labels[p] == 0][: args.max_pmids - len(pos)]
        pmids = sorted(pos + neg, key=int)
        print(f"sampling {len(pmids)} of {len(labels)} PMIDs ({len(pos)} included, {len(neg)} excluded)", file=sys.stderr)

    n_inc = sum(1 for p in pmids if labels[p] == 1)
    print(f"records to fetch: {len(pmids)} ({n_inc} included, {len(pmids) - n_inc} excluded)", file=sys.stderr)

    print("fetching from PubMed…", file=sys.stderr)
    records = fetch_pubmed_records(pmids, email=args.email)
    print(f"got {len(records)}/{len(pmids)} PubMed records", file=sys.stderr)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        kept = 0
        for pmid in pmids:
            rec = records.get(pmid)
            if rec is None or not rec.get("Title"):
                # Skip PMIDs we couldn't resolve — usually retracted/deleted.
                continue
            row_out = {k: rec.get(k, "") for k in CSV_COLUMNS}
            row_out["_GoldStandard"] = "Include" if labels[pmid] == 1 else "Exclude"
            writer.writerow(row_out)
            kept += 1

    print(f"wrote {kept} rows to {out_path}", file=sys.stderr)
    print(
        "\nNext steps:\n"
        f"  1. Open the app, complete Setup, then upload {out_path} on the Title Screening page.\n"
        "  2. Run screening (set keywords if you want, otherwise leave blank).\n"
        "  3. Download the screened output CSV from the file list (named *_titles_*.csv or similar).\n"
        f"  4. Score it: python validation/run_validation.py score --predictions <screened.csv> --topic {row['topic_id']}\n",
        file=sys.stderr,
    )
    return 0


# ─────────────── score subcommand ───────────────


def _read_predictions(path: Path) -> dict[str, str]:
    """Return {pmid: 'Include'|'Exclude'} from the screened CSV.

    The screening CSV usually has columns: PMID, Title, ..., OpenAI_Screen,
    Confidence, Reason. We tolerate small variations in the prediction
    column name.
    """
    pred: dict[str, str] = {}
    pred_col_candidates = (
        "OpenAI_Screen",
        "AI_Screen",
        "Screen",
        "Predicted",
        "OpenAI_Screen_Title",
    )
    with path.open() as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            sys.exit(f"empty CSV: {path}")
        col = next((c for c in pred_col_candidates if c in reader.fieldnames), None)
        if not col:
            sys.exit(
                f"no prediction column found in {path}. expected one of: {', '.join(pred_col_candidates)}"
            )
        for row in reader:
            pmid = (row.get("PMID") or "").strip()
            if not pmid:
                continue
            v = (row.get(col) or "").strip()
            vlow = v.lower()
            # ReviewPyper outputs 1/0 by default; some configs output Include/Exclude.
            if vlow in ("1", "true", "yes") or vlow.startswith("incl"):
                pred[pmid] = "Include"
            elif vlow in ("0", "false", "no") or vlow.startswith("excl"):
                pred[pmid] = "Exclude"
            else:
                pred[pmid] = v  # leave as-is; will count as wrong unless gold matches
    return pred


def _wss(labels: list[int], scores: list[float], target_recall: float = 0.95) -> float | None:
    """Work Saved over Sampling at target recall.

    WSS@R = (TN + FN) / N − (1 − R)

    Where TN+FN are records below the threshold that achieves recall R.
    Without continuous scores we use the binary prediction as a rank proxy:
    Include = 1.0, Exclude = 0.0. With binary scores, WSS@95 collapses to a
    simple TN/(N) − 0.05 — useful but coarse.
    """
    if not labels:
        return None
    n = len(labels)
    n_pos = sum(labels)
    if n_pos == 0:
        return None

    # Sort by score descending (highest = most likely Include).
    pairs = sorted(zip(scores, labels), key=lambda p: -p[0])
    tp = 0
    for k, (_, lab) in enumerate(pairs, start=1):
        if lab == 1:
            tp += 1
        if tp / n_pos >= target_recall:
            # k records examined → TN + FN = n - k
            return (n - k) / n - (1 - target_recall)
    return 0.0


def cmd_score(args: argparse.Namespace) -> int:
    pred_path = Path(args.predictions)
    if not pred_path.is_file():
        sys.exit(f"predictions file not found: {pred_path}")
    row = load_inventory_row(args.topic, args.year, args.split)
    qrels_files = find_qrels_files(row["year"], row["split"], row["review_type"])
    labels = load_qrels(row["topic_id"], qrels_files)

    pred = _read_predictions(pred_path)

    # Restrict to PMIDs we have both gold + prediction for.
    common = sorted(set(pred) & set(labels), key=int)
    missing_pred = sorted(set(labels) - set(pred), key=int)
    extra_pred = sorted(set(pred) - set(labels), key=int)

    if not common:
        sys.exit("no PMIDs in common between predictions and gold standard")

    tp = fp = fn = tn = 0
    for pmid in common:
        gold = labels[pmid] == 1
        is_inc = pred[pmid] == "Include"
        if gold and is_inc:
            tp += 1
        elif gold and not is_inc:
            fn += 1
        elif not gold and is_inc:
            fp += 1
        else:
            tn += 1

    n = tp + fp + fn + tn
    n_pos = tp + fn
    n_neg = tn + fp

    recall = tp / n_pos if n_pos else float("nan")
    precision = tp / (tp + fp) if (tp + fp) else float("nan")
    accuracy = (tp + tn) / n if n else float("nan")
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else float("nan")

    bin_scores = [1.0 if pred[p] == "Include" else 0.0 for p in common]
    bin_labels = [labels[p] for p in common]
    wss95 = _wss(bin_labels, bin_scores, target_recall=0.95)

    report = {
        "topic": row["topic_id"],
        "title": row["title"],
        "slice": f"{row['year']}/{row['review_type']}/{row['split']}",
        "n_records_scored": n,
        "n_included_gold": n_pos,
        "n_excluded_gold": n_neg,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
        "recall": recall,
        "precision": precision,
        "f1": f1,
        "accuracy": accuracy,
        "wss_at_95_binary": wss95,
        "missing_predictions": len(missing_pred),
        "predictions_not_in_gold": len(extra_pred),
    }

    print(f"\nTopic: {row['topic_id']}  ·  {row['title']}")
    print(f"Slice: {report['slice']}")
    print(f"Records scored: {n}  ({n_pos} included gold, {n_neg} excluded gold)")
    if missing_pred:
        print(f"  ⚠ {len(missing_pred)} PMIDs in gold without a prediction (e.g. {missing_pred[:3]})")
    if extra_pred:
        print(f"  ⚠ {len(extra_pred)} PMIDs predicted that aren't in gold (e.g. {extra_pred[:3]})")
    print()
    print(f"           Predicted Include   Predicted Exclude")
    print(f"  Gold Include   {tp:>5d} (TP)         {fn:>5d} (FN)")
    print(f"  Gold Exclude   {fp:>5d} (FP)         {tn:>5d} (TN)")
    print()
    print(f"  Recall    {recall:.3f}   ←  fraction of true includes the AI caught")
    print(f"  Precision {precision:.3f}   ←  fraction of AI-predicted includes that were correct")
    print(f"  F1        {f1:.3f}")
    print(f"  Accuracy  {accuracy:.3f}")
    if wss95 is not None:
        print(f"  WSS@95    {wss95:+.3f}   ←  work saved over random at 95% recall (binary, coarse)")
    print()

    if args.report:
        Path(args.report).write_text(json.dumps(report, indent=2))
        print(f"wrote JSON report to {args.report}", file=sys.stderr)

    return 0


# ─────────────── main ───────────────


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_prep = sub.add_parser("prep", help="Build a ReviewPyper input CSV for a CLEF-TAR topic")
    p_prep.add_argument("topic", help="CLEF-TAR topic ID, e.g. CD010355")
    p_prep.add_argument("--out", required=True, help="Output CSV path")
    p_prep.add_argument("--email", required=True, help="Email for PubMed E-utilities (NCBI requires it)")
    p_prep.add_argument("--year", choices=["2017", "2018", "2019"])
    p_prep.add_argument("--split", choices=["train", "test"])
    p_prep.add_argument("--max-pmids", type=int, help="Sample N PMIDs (stratified by gold label)")
    p_prep.set_defaults(func=cmd_prep)

    p_score = sub.add_parser("score", help="Score a screened CSV against the gold standard")
    p_score.add_argument("--predictions", required=True, help="Path to the screened CSV from the app")
    p_score.add_argument("--topic", required=True, help="CLEF-TAR topic ID")
    p_score.add_argument("--year", choices=["2017", "2018", "2019"])
    p_score.add_argument("--split", choices=["train", "test"])
    p_score.add_argument("--report", help="Optional path to write a JSON metrics report")
    p_score.set_defaults(func=cmd_score)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
