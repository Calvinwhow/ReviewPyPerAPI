"""File management routes.

The browser cannot write directly to the shared /data volume.
This router handles upload, download, listing, and deletion of files
so the frontend can feed file paths into the ReviewPyPerAPI pipeline.
"""

from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/files", tags=["files"])

DATA_DIR = Path(os.environ.get("DATA_DIR", "./data")).resolve()


def _safe_path(relative: str) -> Path:
    """Resolve a relative path under DATA_DIR, preventing traversal."""
    resolved = (DATA_DIR / relative).resolve()
    if not str(resolved).startswith(str(DATA_DIR)):
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


class ProjectInfo(BaseModel):
    project_id: str
    path: str


class FileInfo(BaseModel):
    name: str
    path: str
    size: int
    is_dir: bool


class UploadResponse(BaseModel):
    filename: str
    path: str


class ApiKeyResponse(BaseModel):
    api_key_path: str


# --- Project management (a project = a folder) ---


@router.post("/projects", response_model=ProjectInfo)
async def create_project(name: str = Form(...)):
    """Create a new project folder in /data."""
    project_id = uuid.uuid4().hex[:12]
    project_dir = DATA_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    # Store project name as metadata
    (project_dir / ".project_name").write_text(name)
    return ProjectInfo(project_id=project_id, path=str(project_dir))


@router.get("/projects", response_model=list[ProjectInfo])
async def list_projects():
    """List all project folders."""
    projects = []
    if not DATA_DIR.exists():
        return projects
    for entry in sorted(DATA_DIR.iterdir()):
        if entry.is_dir() and not entry.name.startswith("."):
            projects.append(ProjectInfo(project_id=entry.name, path=str(entry)))
    return projects


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    project_dir = _safe_path(project_id)
    if not project_dir.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")
    shutil.rmtree(project_dir)
    return {"deleted": project_id}


# --- File operations ---


@router.post("/upload/{project_id}", response_model=UploadResponse)
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    subfolder: str = Form(""),
):
    """Upload a file into a project folder."""
    project_dir = _safe_path(project_id)
    if not project_dir.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")

    target_dir = project_dir / subfolder if subfolder else project_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    dest = target_dir / file.filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return UploadResponse(filename=file.filename, path=str(dest))


@router.get("/download/{path:path}")
async def download_file(path: str):
    """Download a file from /data by its path."""
    file_path = _safe_path(path)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=file_path.name)


@router.get("/list/{project_id}", response_model=list[FileInfo])
async def list_files(project_id: str, subfolder: str = ""):
    """List files in a project folder."""
    target = _safe_path(f"{project_id}/{subfolder}" if subfolder else project_id)
    if not target.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")

    entries = []
    for entry in sorted(target.iterdir()):
        if entry.name.startswith("."):
            continue
        entries.append(FileInfo(
            name=entry.name,
            path=str(entry),
            size=entry.stat().st_size if entry.is_file() else 0,
            is_dir=entry.is_dir(),
        ))
    return entries


@router.delete("/delete/{path:path}")
async def delete_file(path: str):
    """Delete a file from /data."""
    file_path = _safe_path(path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    if file_path.is_dir():
        shutil.rmtree(file_path)
    else:
        file_path.unlink()
    return {"deleted": str(file_path)}


# --- API key helper ---


@router.post("/apikey/{project_id}", response_model=ApiKeyResponse)
async def save_api_key(project_id: str, api_key: str = Form(...)):
    """Save an API key to a file in the project folder.

    ReviewPyPerAPI expects a file path to the API key, not the key itself.
    This endpoint bridges that gap.
    """
    project_dir = _safe_path(project_id)
    if not project_dir.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")

    key_path = project_dir / "api_key.txt"
    key_path.write_text(api_key.strip())
    return ApiKeyResponse(api_key_path=str(key_path))
