"""
routes/ocr.py — OCR Endpoint

POST /api/ai/ocr
Accepts a base64-encoded PDF and returns extracted text.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.schemas import OCRRequest, OCRResponse
from app.services.ocr_service import extract_text_from_pdf

logger = logging.getLogger("lokai.routes.ocr")
router = APIRouter()


@router.post("/ocr", response_model=OCRResponse)
async def ocr_endpoint(req: OCRRequest):
    try:
        result = extract_text_from_pdf(req.file_base64, req.language)
        return OCRResponse(**result)
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
