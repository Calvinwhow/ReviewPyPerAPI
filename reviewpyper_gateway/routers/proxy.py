"""Transparent proxy to ReviewPyPerAPI.

Every POST to /pipeline/{path} is forwarded as-is to the ReviewPyPerAPI
container. The gateway adds nothing — request body in, response body out.
This preserves the stateless, file-based architecture of ReviewPyPerAPI.

When ?test=true is passed, the gateway returns synthetic data directly
without contacting ReviewPyPerAPI. It also creates real files on disk
so the file browser and pipeline state work end-to-end.
"""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path

import httpx
from fastapi import APIRouter, Query, Request, HTTPException

router = APIRouter(prefix="/pipeline", tags=["pipeline"])

REVIEWPYPER_API_URL = os.environ.get("REVIEWPYPER_API_URL", "http://localhost:8000")
DATA_DIR = Path(os.environ.get("DATA_DIR", "./data")).resolve()

# Long timeout: screening/extraction can take minutes
_client = httpx.AsyncClient(base_url=REVIEWPYPER_API_URL, timeout=600.0)


# ---------------------------------------------------------------------------
# Synthetic test data
# ---------------------------------------------------------------------------

SYNTHETIC_STUDIES = [
    {
        "PMID": "34567890",
        "Title": "Deep Brain Stimulation for Treatment-Resistant OCD: A Randomized Controlled Trial",
        "Authors": "Smith J, Chen L, Williams R",
        "Year": "2023",
        "Journal": "Journal of Neurosurgery",
        "Abstract": "Background: Treatment-resistant obsessive-compulsive disorder (OCD) affects approximately 10-40% of patients. Deep brain stimulation (DBS) targeting the ventral capsule/ventral striatum has shown promise. Methods: We conducted a double-blind, sham-controlled RCT with 40 patients. Results: Active DBS showed significant improvement in Y-BOCS scores (mean reduction 35.2%) compared to sham (12.1%, p<0.001). Conclusion: DBS is effective for treatment-resistant OCD.",
        "DOI": "10.1234/jns.2023.001",
        "OpenAI_Screen": "Include",
        "Confidence": "0.92",
        "Reason": "Directly addresses DBS for OCD with RCT design",
    },
    {
        "PMID": "34567891",
        "Title": "Cognitive Outcomes Following DBS in Obsessive-Compulsive Disorder: A 5-Year Follow-Up",
        "Authors": "Park S, Gonzalez M, Ahmed K",
        "Year": "2022",
        "Journal": "Biological Psychiatry",
        "Abstract": "Objective: To assess long-term cognitive outcomes in OCD patients who underwent DBS. Methods: 28 patients completed neuropsychological assessments at baseline, 1, 3, and 5 years post-surgery. Results: No significant cognitive decline was observed. Executive function showed mild improvement (p=0.04). Verbal fluency remained stable. Conclusion: DBS for OCD does not produce long-term cognitive impairment.",
        "DOI": "10.1234/bp.2022.045",
        "OpenAI_Screen": "Include",
        "Confidence": "0.88",
        "Reason": "Long-term cognitive outcomes of DBS for OCD",
    },
    {
        "PMID": "34567892",
        "Title": "Transcranial Magnetic Stimulation vs Pharmacotherapy for Mild OCD",
        "Authors": "Davis T, Brown A",
        "Year": "2023",
        "Journal": "Clinical Psychology Review",
        "Abstract": "This study compares TMS and SSRIs for mild OCD. 120 patients with mild OCD (Y-BOCS 8-15) were randomized. Both treatments showed similar efficacy. TMS had fewer side effects. DBS was not investigated.",
        "DOI": "10.1234/cpr.2023.012",
        "OpenAI_Screen": "Exclude",
        "Confidence": "0.95",
        "Reason": "Study focuses on TMS, not DBS. Population is mild OCD, not treatment-resistant.",
    },
    {
        "PMID": "34567893",
        "Title": "Systematic Review of Neuromodulation Targets for OCD",
        "Authors": "Lee K, Martinez P, O'Brien S",
        "Year": "2024",
        "Journal": "Neurosurgical Focus",
        "Abstract": "We systematically reviewed 45 studies on neuromodulation for OCD. Targets included ventral capsule/ventral striatum, subthalamic nucleus, and nucleus accumbens. The VC/VS target showed the most consistent results with a mean Y-BOCS reduction of 42%. The STN target showed faster response but more mood side effects.",
        "DOI": "10.1234/nf.2024.008",
        "OpenAI_Screen": "Include",
        "Confidence": "0.85",
        "Reason": "Comprehensive review of DBS targets for OCD",
    },
    {
        "PMID": "34567894",
        "Title": "Deep Brain Stimulation Hardware Complications: A Multi-Center Analysis",
        "Authors": "Taylor R, Kim J, Patel N",
        "Year": "2023",
        "Journal": "Stereotactic and Functional Neurosurgery",
        "Abstract": "We analyzed hardware complications in 312 DBS patients across 8 centers (2015-2023). Infection rate was 3.2%, lead migration 1.9%, and device malfunction 2.5%. OCD patients (n=45) had similar complication rates to movement disorder patients. Revision surgery was needed in 8.3% of cases.",
        "DOI": "10.1234/sfn.2023.099",
        "OpenAI_Screen": "Include",
        "Confidence": "0.72",
        "Reason": "Reports DBS complications including OCD cohort, relevant safety data",
    },
]

SYNTHETIC_EXTRACTION = {
    "sample_size": "40 patients (20 active, 20 sham)",
    "study_design": "Double-blind randomized controlled trial",
    "dbs_target": "Ventral capsule/ventral striatum (VC/VS)",
    "primary_outcome": "Y-BOCS score reduction at 12 months",
    "mean_improvement": "35.2% reduction in active group vs 12.1% in sham",
    "adverse_events": "2 infections (5%), 1 lead migration (2.5%)",
    "follow_up_duration": "24 months",
    "responder_rate": "60% (≥35% Y-BOCS reduction)",
}

SYNTHETIC_INCLUSION = {
    "Is DBS the primary intervention?": 1,
    "Is the population treatment-resistant OCD?": 1,
    "Are clinical outcomes reported?": 1,
    "Is there a control or comparison group?": 0,
}


def _ensure_dir(path: str) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def _write_csv(path: str, rows: list[dict]) -> str:
    filepath = Path(path)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    return str(filepath)


def _write_json(path: str, data: dict | list) -> str:
    filepath = Path(path)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
    return str(filepath)


def _get_test_dir(body: dict) -> str:
    """Try to figure out a project dir from the request body."""
    for key in ("csv_path", "api_key_path", "master_list_path", "json_file_path", "input_dir", "folder_path"):
        val = body.get(key, "")
        if val and str(DATA_DIR) in val:
            parts = Path(val).relative_to(DATA_DIR).parts
            if parts:
                return str(DATA_DIR / parts[0])
    return str(DATA_DIR / "test_project")


# ---------------------------------------------------------------------------
# Test data generators per endpoint
# ---------------------------------------------------------------------------

def _test_titles_screen(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    csv_path = f"{project_dir}/references_title_screened.csv"
    _write_csv(csv_path, SYNTHETIC_STUDIES)
    return {"output_csv_path": csv_path}


def _test_abstracts_screen(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    screened = f"{project_dir}/abstracts_screened.csv"
    master = f"{project_dir}/master_list.csv"
    _write_csv(screened, SYNTHETIC_STUDIES)
    _write_csv(master, SYNTHETIC_STUDIES)
    return {"screened_abstract_path": screened, "master_list_path": master}


def _test_pdfs_download(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    csv_path = f"{project_dir}/pdfs_downloaded.csv"
    rows = [{"PMID": s["PMID"], "Title": s["Title"], "PDF_Path": f"{project_dir}/PDFs/{s['PMID']}.pdf"} for s in SYNTHETIC_STUDIES[:3]]
    _write_csv(csv_path, rows)
    # Create dummy PDF files
    pdf_dir = _ensure_dir(f"{project_dir}/PDFs")
    for s in SYNTHETIC_STUDIES[:3]:
        (pdf_dir / f"{s['PMID']}.pdf").write_text(f"[Synthetic PDF for {s['Title']}]")
    return {"csv_path": csv_path}


def _test_pdfs_postprocess(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    master = f"{project_dir}/master_list_postprocessed.csv"
    rows = [{"PMID": s["PMID"], "Title": s["Title"], "PDF_Available": "Yes"} for s in SYNTHETIC_STUDIES[:3]]
    _write_csv(master, rows)
    return {"master_list_path": master}


def _test_pdfs_ocr(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    ocr_dir = _ensure_dir(f"{project_dir}/ocr_output")
    for s in SYNTHETIC_STUDIES[:3]:
        (ocr_dir / f"{s['PMID']}.txt").write_text(
            f"Title: {s['Title']}\n\nAbstract:\n{s['Abstract']}\n\n"
            "Methods:\nThis was a randomized controlled trial conducted at a single center.\n\n"
            "Results:\nPrimary outcomes were met with statistical significance (p<0.05).\n\n"
            "Discussion:\nOur findings support the use of this intervention in the target population.\n"
        )
    return {"output_dir": str(ocr_dir)}


def _test_text_preprocess(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    out_dir = _ensure_dir(f"{project_dir}/preprocessed_text")
    for s in SYNTHETIC_STUDIES[:3]:
        (out_dir / f"{s['PMID']}_preprocessed.txt").write_text(
            f"{s['Abstract']}\n\nMethods: Randomized controlled trial.\nResults: Significant findings.\n"
        )
    return {"preprocessed_dir": str(out_dir)}


def _test_sections_label(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    json_dir = _ensure_dir(f"{project_dir}/sections_json")
    for s in SYNTHETIC_STUDIES[:3]:
        _write_json(str(json_dir / f"{s['PMID']}.json"), {
            "title": s["Title"],
            "abstract": s["Abstract"],
            "methods": "This was a randomized controlled trial with 40 patients randomized 1:1 to active DBS or sham stimulation.",
            "results": "Active DBS showed significant improvement in Y-BOCS scores compared to sham (p<0.001). Response rate was 60%.",
            "discussion": "Our findings support DBS as an effective treatment for treatment-resistant OCD.",
            "conclusion": "DBS targeting VC/VS is effective and safe for treatment-resistant OCD.",
        })
    return {"json_dir": str(json_dir)}


def _test_inclusion_evaluate(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    evaluated = f"{project_dir}/inclusion_evaluated.json"
    raw_csv = f"{project_dir}/inclusion_exclusion_results.csv"
    auto_csv = f"{project_dir}/inclusion_exclusion_results_dropped.csv"

    eval_data = {}
    for s in SYNTHETIC_STUDIES:
        scores = {q: (1 if s["OpenAI_Screen"] == "Include" else 0) for q in SYNTHETIC_INCLUSION}
        eval_data[s["PMID"]] = {"title": s["Title"], "scores": scores, "total": sum(scores.values())}
    _write_json(evaluated, eval_data)

    rows = [{"PMID": s["PMID"], "Title": s["Title"], "Decision": s["OpenAI_Screen"], "Total_Score": 4 if s["OpenAI_Screen"] == "Include" else 1} for s in SYNTHETIC_STUDIES]
    _write_csv(raw_csv, rows)
    _write_csv(auto_csv, [r for r in rows if r["Decision"] == "Include"])

    return {"evaluated_json_path": evaluated, "raw_csv_path": raw_csv, "automated_csv_path": auto_csv}


def _test_extraction_evaluate(body: dict) -> dict:
    project_dir = _get_test_dir(body)
    filtered = f"{project_dir}/extraction_filtered.json"
    evaluated = f"{project_dir}/extraction_evaluated.json"
    raw_csv = f"{project_dir}/extraction_raw.csv"
    auto_csv = f"{project_dir}/extraction_automated.csv"

    included = [s for s in SYNTHETIC_STUDIES if s["OpenAI_Screen"] == "Include"]
    eval_data = {}
    for s in included:
        eval_data[s["PMID"]] = {"title": s["Title"], "extraction": SYNTHETIC_EXTRACTION}
    _write_json(filtered, eval_data)
    _write_json(evaluated, eval_data)

    rows = [{"PMID": s["PMID"], "Title": s["Title"], **SYNTHETIC_EXTRACTION} for s in included]
    _write_csv(raw_csv, rows)
    _write_csv(auto_csv, rows)

    return {"filtered_json_path": filtered, "evaluated_json_path": evaluated, "raw_csv_path": raw_csv, "automated_csv_path": auto_csv}


# Map endpoint paths to test handlers
_TEST_HANDLERS: dict[str, callable] = {
    "titles/screen": _test_titles_screen,
    "abstracts/screen": _test_abstracts_screen,
    "pdfs/download": _test_pdfs_download,
    "pdfs/postprocess": _test_pdfs_postprocess,
    "pdfs/ocr": _test_pdfs_ocr,
    "text/preprocess": _test_text_preprocess,
    "sections/label": _test_sections_label,
    "inclusion/evaluate": _test_inclusion_evaluate,
    "extraction/evaluate": _test_extraction_evaluate,
}


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

@router.post("/{path:path}")
async def proxy_to_reviewpyper(path: str, request: Request, test: bool = Query(False)):
    """Forward any POST request to ReviewPyPerAPI unchanged.

    When test=true, returns synthetic data directly from the gateway
    without contacting ReviewPyPerAPI. Creates real files on disk.
    """
    body_bytes = await request.body()

    # --- Test mode: return synthetic data ---
    if test:
        try:
            body = json.loads(body_bytes) if body_bytes else {}
        except json.JSONDecodeError:
            body = {}

        handler = _TEST_HANDLERS.get(path)
        if handler:
            return handler(body)
        return {"error": f"No test handler for path: {path}"}

    # --- Real mode: proxy to ReviewPyPerAPI ---
    content_type = request.headers.get("content-type", "application/json")

    try:
        response = await _client.post(
            f"/{path}",
            content=body_bytes,
            headers={"content-type": content_type},
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="ReviewPyPerAPI is not reachable. Is the Docker container running?",
        )

    return response.json()
