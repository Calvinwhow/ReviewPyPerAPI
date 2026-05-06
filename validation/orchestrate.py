"""Drive the full validation flow against a running ReviewPyperAPI.

Creates a project, uploads the prepped CSV, triggers title screening,
waits for completion, and copies the screened output to a local path.

Usage:
    python validation/orchestrate.py \\
        --input validation/runs/CD010355_input.csv \\
        --question "Does NIPPV prevent post-pulmonary-resection complications?" \\
        --api-base http://localhost:3000/api \\
        --out-screened validation/runs/CD010355_screened.csv
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlencode

# Lightweight multipart encoder so we don't need the requests library.
import mimetypes
import secrets


def _multipart_body(fields: dict[str, str], files: dict[str, tuple[str, bytes]]) -> tuple[bytes, str]:
    boundary = "----RP" + secrets.token_hex(16)
    parts: list[bytes] = []
    for name, value in fields.items():
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        parts.append(value.encode())
        parts.append(b"\r\n")
    for name, (filename, data) in files.items():
        ctype = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode()
        )
        parts.append(f"Content-Type: {ctype}\r\n\r\n".encode())
        parts.append(data)
        parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)
    return body, f"multipart/form-data; boundary={boundary}"


def _http(method: str, url: str, body: bytes | None = None, headers: dict[str, str] | None = None) -> bytes:
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=900) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        sys.exit(f"HTTP {exc.code} on {method} {url}\n{detail}")


def create_project(base: str, name: str) -> dict:
    body, ctype = _multipart_body({"name": name}, {})
    raw = _http("POST", f"{base}/files/projects", body, {"Content-Type": ctype})
    return json.loads(raw)


def upload_file(base: str, project_id: str, path: Path) -> dict:
    body, ctype = _multipart_body(
        {"subfolder": ""}, {"file": (path.name, path.read_bytes())}
    )
    raw = _http("POST", f"{base}/files/upload/{project_id}", body, {"Content-Type": ctype})
    return json.loads(raw)


def screen_titles(base: str, api_key_path: str, csv_path: str, question: str, model: str) -> dict:
    payload = {
        "api_key_path": api_key_path,
        "csv_path": csv_path,
        "question": question,
        "model_choice": model,
    }
    raw = _http(
        "POST",
        f"{base}/titles/screen",
        json.dumps(payload).encode(),
        {"Content-Type": "application/json"},
    )
    return json.loads(raw)


def download_file(base: str, server_path: str, out: Path) -> None:
    # /files/download/{path:path} accepts the full server path (starting at DATA_DIR).
    # We need the part of the path AFTER DATA_DIR to feed into the URL.
    # The screened CSV path is something like /data/<project_id>/.../titles_xxx.csv;
    # _safe_path joins DATA_DIR + relative, so we strip the leading /data/ prefix
    # if present, otherwise pass as-is.
    rel = server_path.lstrip("/")
    if rel.startswith("data/"):
        rel = rel[len("data/") :]
    raw = _http("GET", f"{base}/files/download/{rel}")
    out.write_bytes(raw)


def list_files(base: str, project_id: str) -> list[dict]:
    raw = _http("GET", f"{base}/files/list/{project_id}")
    return json.loads(raw)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    p.add_argument("--input", required=True, help="Local CSV path to upload")
    p.add_argument("--question", required=True, help="Research question for the screener")
    p.add_argument("--api-base", default="http://localhost:3000/api", help="API base URL")
    p.add_argument("--name", default=None, help="Project name (defaults to input filename stem)")
    p.add_argument("--model", default="gpt3_small", help="Model choice key understood by ReviewPyper")
    p.add_argument("--out-screened", required=True, help="Where to write the screened CSV locally")
    args = p.parse_args()

    in_path = Path(args.input)
    if not in_path.is_file():
        sys.exit(f"input not found: {in_path}")
    project_name = args.name or in_path.stem
    out_path = Path(args.out_screened)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"→ creating project '{project_name}'…", file=sys.stderr)
    proj = create_project(args.api_base, project_name)
    project_id = proj["project_id"]
    api_key_path = proj.get("api_key_path")
    if not api_key_path:
        sys.exit(
            "create_project did not return api_key_path — server is missing OPENAI_API_KEY env.\n"
            "Stop the stack, `export OPENAI_API_KEY=…` in your shell, and `docker compose ... up` again."
        )
    print(f"  project_id = {project_id}", file=sys.stderr)
    print(f"  api_key_path = {api_key_path}", file=sys.stderr)

    print(f"→ uploading {in_path.name} ({in_path.stat().st_size:,} bytes)…", file=sys.stderr)
    up = upload_file(args.api_base, project_id, in_path)
    csv_server_path = up["path"]
    print(f"  server path = {csv_server_path}", file=sys.stderr)

    print(f"→ running title screening (model={args.model})…", file=sys.stderr)
    print(f"  question: {args.question[:80]}", file=sys.stderr)
    t0 = time.time()
    res = screen_titles(args.api_base, api_key_path, csv_server_path, args.question, args.model)
    elapsed = time.time() - t0
    print(f"  done in {elapsed:.1f}s", file=sys.stderr)
    output_csv_path = res.get("output_csv_path")
    if not output_csv_path:
        sys.exit(f"no output_csv_path in response: {res}")
    print(f"  output_csv_path = {output_csv_path}", file=sys.stderr)

    print(f"→ downloading screened CSV…", file=sys.stderr)
    download_file(args.api_base, output_csv_path, out_path)
    print(f"  wrote {out_path}", file=sys.stderr)

    # Sanity check: confirm we got a CSV with sensible columns.
    with out_path.open() as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        n = sum(1 for _ in reader)
    print(f"  {n} rows · columns: {', '.join(cols[:8])}{'…' if len(cols) > 8 else ''}", file=sys.stderr)

    print(f"\nNext: python validation/run_validation.py score --predictions {out_path} --topic CD010355", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
