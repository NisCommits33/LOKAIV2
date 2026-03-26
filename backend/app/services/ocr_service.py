"""
services/ocr_service.py — PDF OCR Service

Converts PDF pages to images via pdf2image, then extracts text
using Tesseract OCR with support for English and Nepali.
"""

import base64
import io
import logging
import re
import tempfile
from pathlib import Path

import pytesseract
import fitz
from pdf2image import convert_from_bytes
from PIL import Image

from app.config import get_settings

logger = logging.getLogger("lokai.ocr")
settings = get_settings()

if settings.tesseract_cmd and settings.tesseract_cmd != "tesseract":
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


import time


def extract_text_from_pdf(file_base64: str, language: str = "eng", doc_id: str = None) -> dict:
    """
    Decode a base64 PDF, convert each page to an image,
    run Tesseract OCR, and return cleaned text.
    """
    pdf_bytes = base64.b64decode(file_base64)
    logger.info(f"Processing PDF ({len(pdf_bytes)} bytes), lang={language}")

    # --- FAST PATH: PyMuPDF Extraction ---
    try:
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(pdf_doc)
        
        # Initial progress update for fast path
        if doc_id:
            try:
                from app.utils.supabase import get_supabase_client
                sb = get_supabase_client()
                sb.table("personal_documents").update({
                    "ocr_progress": 0.5,
                    "ocr_eta": 0,
                    "ocr_page": page_count // 2,
                    "ocr_total": page_count,
                    "processing_status": "processing"
                }).eq("id", doc_id).execute()
            except Exception as e:
                pass
                
        all_text_fitz = []
        for page in pdf_doc:
            all_text_fitz.append(page.get_text())
            
        raw_text_fitz = "\n\n".join(all_text_fitz)
        cleaned_fitz = clean_ocr_text(raw_text_fitz)
        
        # Heuristic: If we extracted a reasonable amount of text, return it immediately
        # (> 50 chars per page on average). Scanned PDFs will return very little text.
        if len(cleaned_fitz.strip()) > (page_count * 50) or (page_count <= 2 and len(cleaned_fitz.strip()) > 20):
            logger.info("Successfully extracted embedded text using PyMuPDF (Fast Path).")
            # Final DB update
            if doc_id:
                try:
                    from app.utils.supabase import get_supabase_client
                    sb = get_supabase_client()
                    sb.table("personal_documents").update({
                        "ocr_progress": 1.0,
                        "ocr_eta": 0,
                        "ocr_page": page_count,
                        "ocr_total": page_count
                    }).eq("id", doc_id).execute()
                except Exception:
                    pass
            return {
                "text": cleaned_fitz,
                "page_count": page_count,
                "language": language,
                "confidence": 100, # Native extraction doesn't have a true OCR confidence
            }
        else:
            logger.info(f"PyMuPDF extracted insufficient text ({len(cleaned_fitz.strip())} chars for {page_count} pages). Falling back to Tesseract OCR...")
    except Exception as e:
        logger.error(f"PyMuPDF fast path failed: {e}. Falling back to Tesseract OCR...")

    # --- FALLBACK PATH: Tesseract OCR ---
    poppler_kwargs = {}
    if settings.poppler_path:
        poppler_kwargs["poppler_path"] = settings.poppler_path

    # 150 DPI is fast and accurate enough for most documents
    images = convert_from_bytes(pdf_bytes, dpi=150, grayscale=True, **poppler_kwargs)
    page_count = len(images)

    # Initial progress update with estimate
    if doc_id:
        try:
            from app.utils.supabase import get_supabase_client
            sb = get_supabase_client()
            initial_eta = page_count * 3 # Rough estimate (3s per page)
            sb.table("personal_documents").update({
                "ocr_progress": 0,
                "ocr_eta": initial_eta,
                "ocr_page": 0,
                "ocr_total": page_count,
                "processing_status": "processing"
            }).eq("id", doc_id).execute()
        except Exception as db_err:
            logger.error(f"Failed to set initial OCR status: {db_err}")

    all_text = []
    start_time = time.time()

    for i, img in enumerate(images):
        page_start = time.time()
        # Single Tesseract call — extract text directly (skip confidence scoring)
        page_text = pytesseract.image_to_string(img, lang=language)
        all_text.append(page_text)
        logger.info(f"  Page {i + 1}/{page_count}: {len(page_text)} chars")
        # Progress tracking in database
        if doc_id:
            progress = (i + 1) / page_count
            elapsed = time.time() - start_time
            avg_time = elapsed / (i + 1)
            eta = int(avg_time * (page_count - (i + 1)))
            
            # Update progress in the database using Supabase client
            try:
                from app.utils.supabase import get_supabase_client
                sb = get_supabase_client()
                sb.table("personal_documents").update({
                    "ocr_progress": progress,
                    "ocr_eta": eta,
                    "ocr_page": i + 1,
                    "ocr_total": page_count
                }).eq("id", doc_id).execute()
            except Exception as db_err:
                logger.error(f"Failed to update OCR progress in DB: {db_err}")

    raw_text = "\n\n".join(all_text)
    cleaned = clean_ocr_text(raw_text)

    return {
        "text": cleaned,
        "page_count": page_count,
        "language": language,
        "confidence": 0,
    }


def clean_ocr_text(text: str) -> str:
    """
    Remove common OCR artifacts and normalize whitespace.
    """
    # Remove form-feed and other control characters
    text = re.sub(r"[\x0c\x00-\x08\x0b\x0e-\x1f]", "", text)

    # Collapse multiple blank lines into two
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces into one
    text = re.sub(r" {2,}", " ", text)

    # Remove lines that are just dashes, underscores, or equals
    text = re.sub(r"^[\-_=]{3,}$", "", text, flags=re.MULTILINE)

    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)

    return text.strip()
