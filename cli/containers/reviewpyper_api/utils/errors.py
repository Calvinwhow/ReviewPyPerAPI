from __future__ import annotations
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

def to_http_exception(exc: Exception) -> HTTPException:
    logger.exception("Unhandled error")
    if isinstance(exc, FileNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=500, detail="Internal server error")
