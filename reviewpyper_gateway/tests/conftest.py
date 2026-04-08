"""Shared fixtures for gateway tests.

The gateway code reads DATA_DIR from the environment at import time, so we
must set it BEFORE importing any router module. We also reload the router
modules in a fixture to ensure each test session sees a fresh tmp directory.
"""
from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def data_dir(tmp_path_factory) -> Path:
    d = tmp_path_factory.mktemp("gateway-data")
    os.environ["DATA_DIR"] = str(d)
    return d


@pytest.fixture(scope="session")
def app(data_dir: Path) -> FastAPI:
    # Make `routers` importable as a top-level package, like main.py expects.
    gateway_root = Path(__file__).resolve().parent.parent
    if str(gateway_root) not in sys.path:
        sys.path.insert(0, str(gateway_root))

    # Reload to pick up the DATA_DIR env var set above.
    for mod_name in ("routers.files", "routers.proxy"):
        if mod_name in sys.modules:
            importlib.reload(sys.modules[mod_name])

    from routers.files import router as files_router
    from routers.proxy import router as proxy_router

    application = FastAPI()
    application.include_router(files_router)
    application.include_router(proxy_router)
    return application


@pytest.fixture()
def client(app: FastAPI) -> TestClient:
    return TestClient(app)
