"""
routes/process.py — Full Processing Pipeline Endpoint

POST /api/ai/process
Accepts a base64 PDF and runs the full pipeline in the background.
Supports selection between Local, Gemini (Multimodal), and DeepSeek engines.
"""

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.schemas import ProcessRequest
from app.services.ocr_service import extract_text_from_pdf
from app.services.summarization_service import summarize_text
from app.services.question_service import generate_questions

# Cloud AI Services
from app.services.groq_service import (
    summarize_with_groq, 
    generate_questions_with_groq
)
from app.services.chapter_service import extract_chapters

logger = logging.getLogger("lokai.routes.process")
router = APIRouter()


@router.post("/process")
async def process_endpoint(req: ProcessRequest, background_tasks: BackgroundTasks):
    """
    Start the full processing pipeline in the background to avoid timeouts.
    Now supports model_preference: 'local', 'gemini', or 'deepseek'.
    """
    try:
        from app.utils.supabase import get_supabase_client
        sb = get_supabase_client()
        
        # 0. Set initial status to 'processing'
        table_name = getattr(req, "doc_type", "personal_documents")
        sb.table(table_name).update({
            "processing_status": "processing",
            "ocr_progress": 0,
            "ocr_eta": 0
        }).eq("id", req.doc_id).execute()
        
        # 1. Add heavy tasks to background worker
        background_tasks.add_task(
            run_full_pipeline, 
            req.doc_id, 
            req.file_base64, 
            req.language, 
            req.question_count, 
            req.difficulty,
            req.engine_preference,
            getattr(req, "doc_type", "personal_documents")
        )
        
        # Return immediately to the frontend
        return {
            "status": "started", 
            "doc_id": req.doc_id, 
            "engine": req.engine_preference
        }
        
    except Exception as e:
        logger.error(f"Failed to start pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def run_full_pipeline(
    doc_id: str, 
    file_base64: str, 
    language: str, 
    q_count: int, 
    difficulty: str,
    engine_pref: str = "local",
    doc_type: str = "personal_documents"
):
    """
    Heavy processing logic run as a background task. 
    Updates Supabase at each major milestone.
    """
    try:
        from app.utils.supabase import get_supabase_client
        sb = get_supabase_client()

        # Step 1: Extraction (Universal OCR for both Local and Cloud Groq)
        logger.info(f"[{doc_id}] Background step 1/3: Extraction (Engine: {engine_pref})")
        
        # All engines use Tesseract/Poppler now (fixed and stable)
        ocr_result = extract_text_from_pdf(file_base64, language, doc_id)
        page_count = ocr_result.get("page_count", 0)

        if not ocr_result["text"].strip():
            sb.table(doc_type).update({
                "processing_status": "failed", 
                "processing_error": "No text could be extracted from the PDF."
            }).eq("id", doc_id).execute()
            return

        # Step 1.5: Identify Chapters
        logger.info(f"[{doc_id}] Identifying chapters from extracted text...")
        chapters = extract_chapters(ocr_result["text"])
        
        # Update text and chapters for the user to see immediately
        sb.table(doc_type).update({
            "extracted_text": ocr_result["text"],
            "ocr_total": page_count,
            "chapters": chapters,
            "processing_status": "processing" 
        }).eq("id", doc_id).execute()

        # Step 2: Summarize
        logger.info(f"[{doc_id}] Background step 2/3: Summarization ({engine_pref})")
        
        if engine_pref == "groq":
            summary_result = summarize_with_groq(ocr_result["text"])
        else:
            summary_result = summarize_text(ocr_result["text"])
        
        sb.table(doc_type).update({
            "ai_summary": summary_result["summary"],
            "processing_status": "processing"
        }).eq("id", doc_id).execute()

        # Step 3: Generate questions
        logger.info(f"[{doc_id}] Background step 3/3: Question generation ({engine_pref})")
        
        if engine_pref == "groq":
            qg_result = generate_questions_with_groq(ocr_result["text"], q_count, difficulty)
        else:
            qg_result = generate_questions(ocr_result["text"], q_count, difficulty)

        # Store Final Results
        sb.table(doc_type).update({
            "questions": qg_result["questions"],
            "processing_status": "completed",
            "processed_at": "now()"
        }).eq("id", doc_id).execute()
        
        logger.info(f"[{doc_id}] Background pipeline completed successfully using {engine_pref}.")

    except Exception as e:
        logger.error(f"Background pipeline ({engine_pref}) failed for {doc_id}: {e}")
        try:
            from app.utils.supabase import get_supabase_client
            sb = get_supabase_client()
            sb.table(doc_type).update({
                "processing_status": "failed",
                "processing_error": f"AI Engine ({engine_pref}) Error: {str(e)}"
            }).eq("id", doc_id).execute()
        except:
            pass
