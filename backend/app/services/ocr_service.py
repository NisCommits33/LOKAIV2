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
from pdf2image import convert_from_bytes
from PIL import Image

from app.config import get_settings

logger = logging.getLogger("lokai.ocr")
settings = get_settings()

if settings.tesseract_cmd and settings.tesseract_cmd != "tesseract":
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def extract_text_from_pdf(file_base64: str, language: str = "eng") -> dict:
    """
    Decode a base64 PDF, convert each page to an image,
    run Tesseract OCR, and return cleaned text.
    """
    pdf_bytes = base64.b64decode(file_base64)
    logger.info(f"Processing PDF ({len(pdf_bytes)} bytes), lang={language}")

    poppler_kwargs = {}
    if settings.poppler_path:
        poppler_kwargs["poppler_path"] = settings.poppler_path

    # 150 DPI is fast and accurate enough for most documents
    images = convert_from_bytes(pdf_bytes, dpi=150, grayscale=True, **poppler_kwargs)
    page_count = len(images)

    all_text = []

    for i, img in enumerate(images):
        # Single Tesseract call — extract text directly (skip confidence scoring)
        page_text = pytesseract.image_to_string(img, lang=language)
        all_text.append(page_text)
        logger.info(f"  Page {i + 1}/{page_count}: {len(page_text)} chars")

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
