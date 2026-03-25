"""
routes/health.py — Health Check Endpoint

Returns service status, uptime, and model availability.
"""

import time
from fastapi import APIRouter

router = APIRouter()

startup_time: float = time.time()


@router.get("/health")
async def health_check():
    uptime = round(time.time() - startup_time)

    return {
        "status": "healthy",
        "service": "lokai-ai",
        "uptime_seconds": uptime,
        "models": {
            "ocr": "tesseract",
            "summarization": "facebook/bart-large-cnn",
            "question_generation": "valhalla/t5-small-qg-hl",
        },
    }
