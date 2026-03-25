"""
routes/process.py — Full Processing Pipeline Endpoint

POST /api/ai/process
Accepts a base64 PDF and runs the full pipeline:
OCR → Summarization → Question Generation
"""

import logging
from fastapi import APIRouter, HTTPException

from app.schemas import ProcessRequest, ProcessResponse
from app.services.ocr_service import extract_text_from_pdf
from app.services.summarization_service import summarize_text
from app.services.question_service import generate_questions

logger = logging.getLogger("lokai.routes.process")
router = APIRouter()


@router.post("/process", response_model=ProcessResponse)
async def process_endpoint(req: ProcessRequest):
    try:
        # Step 1: OCR
        logger.info("Pipeline step 1/3: OCR")
        ocr_result = extract_text_from_pdf(req.file_base64, req.language)

        if not ocr_result["text"].strip():
            raise HTTPException(status_code=422, detail="No text could be extracted from the PDF")

        # Step 2: Summarize
        logger.info("Pipeline step 2/3: Summarization")
        summary_result = summarize_text(ocr_result["text"])

        # Step 3: Generate questions
        logger.info("Pipeline step 3/3: Question generation")
        qg_result = generate_questions(
            ocr_result["text"],
            count=req.question_count,
            difficulty=req.difficulty,
        )

        return ProcessResponse(
            text=ocr_result["text"],
            page_count=ocr_result["page_count"],
            summary=summary_result["summary"],
            questions=qg_result["questions"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
