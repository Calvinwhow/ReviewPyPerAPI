from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from logic.pdfs import download_pdfs, postprocess_pdfs, ocr_pdfs
from models.pdfs_models import (
    PdfDownloadRequest, PdfDownloadResponse,
    PdfPostProcessRequest, PdfPostProcessResponse,
    PdfOcrRequest, PdfOcrResponse,
)
from utils.errors import to_http_exception

router = APIRouter(prefix="/pdfs", tags=["pdfs"])


@router.post("/download", response_model=PdfDownloadResponse)
async def download_pdfs_endpoint(payload: PdfDownloadRequest, test: bool = Query(False)) -> PdfDownloadResponse:
    if test:
        return PdfDownloadResponse(csv_path="/data/test_project/pdfs_downloaded.csv")
    try:
        csv_path = await run_in_threadpool(download_pdfs, csv_path=payload.csv_path, email=payload.email, allow_scihub=payload.allow_scihub, inclusion_column=payload.inclusion_column)
        return PdfDownloadResponse(csv_path=csv_path)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc


@router.post("/postprocess", response_model=PdfPostProcessResponse)
async def postprocess_pdfs_endpoint(payload: PdfPostProcessRequest, test: bool = Query(False)) -> PdfPostProcessResponse:
    if test:
        return PdfPostProcessResponse(master_list_path="/data/test_project/master_list_postprocessed.csv")
    try:
        master_list_path = await run_in_threadpool(postprocess_pdfs, master_list_path=payload.master_list_path, pdf_dir=payload.pdf_dir, PMID_column=payload.PMID_column, pdf_name_column=payload.pdf_name_column)
        return PdfPostProcessResponse(master_list_path=master_list_path)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc


@router.post("/ocr", response_model=PdfOcrResponse)
async def ocr_pdfs_endpoint(payload: PdfOcrRequest, test: bool = Query(False)) -> PdfOcrResponse:
    if test:
        return PdfOcrResponse(output_dir="/data/test_project/ocr_output")
    try:
        output_dir = await run_in_threadpool(ocr_pdfs, master_list_path=payload.master_list_path, page_threshold=payload.page_threshold, output_dir=payload.output_dir)
        return PdfOcrResponse(output_dir=output_dir)
    except HTTPException:
        raise
    except Exception as exc:
        raise to_http_exception(exc) from exc
