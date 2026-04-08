"""Tests for the pipeline proxy router.

Two modes covered:
  * test=true → synthetic handlers, real files written
  * test=false → forwarded via httpx; we mock the upstream with respx
"""
from __future__ import annotations

from pathlib import Path

import httpx
import pytest
import respx


def _new_project(client) -> tuple[str, Path]:
    pid = client.post("/files/projects", data={"name": "p"}).json()["project_id"]
    from routers.files import DATA_DIR
    return pid, DATA_DIR / pid


def test_titles_screen_test_mode_writes_csv(client):
    pid, project_dir = _new_project(client)
    body = {"csv_path": str(project_dir / "input.csv")}
    r = client.post("/pipeline/titles/screen?test=true", json=body)
    assert r.status_code == 200
    out = Path(r.json()["output_csv_path"])
    assert out.exists() and out.suffix == ".csv"
    assert "PMID" in out.read_text().splitlines()[0]


def test_pdfs_download_test_mode_creates_pdf_files(client):
    pid, project_dir = _new_project(client)
    body = {"csv_path": str(project_dir / "abstracts.csv")}
    r = client.post("/pipeline/pdfs/download?test=true", json=body)
    assert r.status_code == 200
    pdf_dir = project_dir / "PDFs"
    assert pdf_dir.is_dir()
    assert len(list(pdf_dir.glob("*.pdf"))) >= 1


def test_inclusion_evaluate_test_mode_writes_three_outputs(client):
    pid, project_dir = _new_project(client)
    body = {"json_dir": str(project_dir / "sections_json")}
    r = client.post("/pipeline/inclusion/evaluate?test=true", json=body)
    assert r.status_code == 200
    j = r.json()
    for key in ("evaluated_json_path", "raw_csv_path", "automated_csv_path"):
        assert Path(j[key]).exists()


def test_unknown_test_path_returns_error_payload(client):
    r = client.post("/pipeline/totally/bogus?test=true", json={})
    assert r.status_code == 200
    assert "error" in r.json()


def test_proxy_forwards_to_upstream(client):
    with respx.mock(base_url="http://localhost:8000") as mock:
        route = mock.post("/titles/screen").respond(
            200, json={"output_csv_path": "/data/out.csv"},
        )
        r = client.post(
            "/pipeline/titles/screen",
            json={"csv_path": "/data/in.csv"},
        )
        assert route.called
        assert r.status_code == 200
        assert r.json()["output_csv_path"] == "/data/out.csv"


def test_proxy_returns_503_when_upstream_unreachable(client):
    with respx.mock(base_url="http://localhost:8000") as mock:
        mock.post("/titles/screen").mock(
            side_effect=httpx.ConnectError("nope"),
        )
        r = client.post("/pipeline/titles/screen", json={"csv_path": "/x"})
        assert r.status_code == 503
        assert "ReviewPyPerAPI" in r.json()["detail"]
