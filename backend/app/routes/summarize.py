"""
routes/summarize.py — Summarization Endpoint

POST /api/ai/summarize
Accepts text and returns an AI-generated summary.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.schemas import SummarizeRequest, SummarizeResponse
from app.services.summarization_service import summarize_text

logger = logging.getLogger("lokai.routes.summarize")
router = APIRouter()


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_endpoint(req: SummarizeRequest):
    try:
        result = summarize_text(req.text, req.max_length, req.min_length, req.engine)
        return SummarizeResponse(**result)
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
