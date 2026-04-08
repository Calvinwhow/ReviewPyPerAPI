"""Tests for the files router and _safe_path traversal protection."""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi import HTTPException


def test_safe_path_rejects_parent_traversal(data_dir: Path):
    from routers.files import _safe_path
    with pytest.raises(HTTPException) as exc:
        _safe_path("../etc/passwd")
    assert exc.value.status_code == 400


def test_safe_path_rejects_absolute_outside(data_dir: Path):
    from routers.files import _safe_path
    with pytest.raises(HTTPException):
        _safe_path("/etc/passwd")


def test_safe_path_allows_relative(data_dir: Path):
    from routers.files import _safe_path
    p = _safe_path("foo/bar.txt")
    assert str(p).startswith(str(data_dir))


def test_create_list_delete_project(client):
    r = client.post("/files/projects", data={"name": "demo review"})
    assert r.status_code == 200
    pid = r.json()["project_id"]
    assert len(pid) == 12

    listing = client.get("/files/projects").json()
    assert any(p["project_id"] == pid for p in listing)

    delete = client.delete(f"/files/projects/{pid}")
    assert delete.status_code == 200
    assert delete.json()["deleted"] == pid


def test_upload_list_download_delete_file(client, data_dir: Path):
    pid = client.post("/files/projects", data={"name": "p"}).json()["project_id"]

    files = {"file": ("refs.csv", b"a,b\n1,2\n", "text/csv")}
    up = client.post(f"/files/upload/{pid}", files=files, data={"subfolder": ""})
    assert up.status_code == 200
    assert up.json()["filename"] == "refs.csv"

    listing = client.get(f"/files/list/{pid}").json()
    assert any(f["name"] == "refs.csv" for f in listing)

    rel = f"{pid}/refs.csv"
    dl = client.get(f"/files/download/{rel}")
    assert dl.status_code == 200
    assert dl.content == b"a,b\n1,2\n"

    rm = client.delete(f"/files/delete/{rel}")
    assert rm.status_code == 200


def test_save_api_key(client, data_dir: Path):
    pid = client.post("/files/projects", data={"name": "p"}).json()["project_id"]
    r = client.post(f"/files/apikey/{pid}", data={"api_key": "sk-test  "})
    assert r.status_code == 200
    key_path = Path(r.json()["api_key_path"])
    assert key_path.read_text() == "sk-test"


def test_delete_missing_project_404(client):
    r = client.delete("/files/projects/doesnotexist")
    assert r.status_code == 404


def test_project_state_get_default_empty(client):
    pid = client.post("/files/projects", data={"name": "p"}).json()["project_id"]
    r = client.get(f"/files/projects/{pid}/state")
    assert r.status_code == 200
    assert r.json() == {}


def test_project_state_round_trip(client):
    pid = client.post("/files/projects", data={"name": "p"}).json()["project_id"]
    state = {
        "name": "p",
        "research_question": "Does X work?",
        "review_type": "standard",
        "pipeline_state": {"csv_path": "/data/p/refs.csv"},
    }
    put = client.put(f"/files/projects/{pid}/state", json=state)
    assert put.status_code == 200

    got = client.get(f"/files/projects/{pid}/state").json()
    assert got["pipeline_state"]["csv_path"] == "/data/p/refs.csv"


def test_project_state_404_for_unknown_project(client):
    r = client.get("/files/projects/missing/state")
    assert r.status_code == 404
