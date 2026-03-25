"""
services/summarization_service.py — Text Summarization Service

Uses facebook/bart-large-cnn to produce extractive summaries.
Handles long texts by chunking at paragraph boundaries.
"""

import logging
from transformers import pipeline

from app.config import get_settings

logger = logging.getLogger("lokai.summarize")
settings = get_settings()

# Lazy-loaded model
_summarizer = None


def _get_summarizer():
    global _summarizer
    if _summarizer is None:
        logger.info(f"Loading summarization model: {settings.summarization_model}")
        _summarizer = pipeline(
            "summarization",
            model=settings.summarization_model,
            device=-1,  # CPU
        )
        logger.info("Summarization model loaded.")
    return _summarizer


def summarize_text(text: str, max_length: int = 200, min_length: int = 50) -> dict:
    """
    Summarize the given text. For long texts, chunk and summarize each,
    then combine the chunk summaries into a final summary.
    """
    summarizer = _get_summarizer()
    model_max = settings.max_input_length
    original_length = len(text.split())

    # If text is within model limits, summarize directly
    if original_length <= model_max:
        result = summarizer(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False,
        )
        summary = result[0]["summary_text"]
    else:
        # Chunk by paragraphs
        chunks = _chunk_text(text, model_max)
        logger.info(f"Text chunked into {len(chunks)} segments")

        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            result = summarizer(
                chunk,
                max_length=max_length // len(chunks) + 50,
                min_length=min(min_length, 30),
                do_sample=False,
            )
            chunk_summaries.append(result[0]["summary_text"])
            logger.info(f"  Chunk {i + 1}/{len(chunks)} summarized")

        # If combined summaries are still long, do a meta-summary
        combined = " ".join(chunk_summaries)
        if len(combined.split()) > max_length:
            result = summarizer(
                combined,
                max_length=max_length,
                min_length=min_length,
                do_sample=False,
            )
            summary = result[0]["summary_text"]
        else:
            summary = combined

    summary_length = len(summary.split())
    logger.info(f"Summarized {original_length} → {summary_length} words")

    return {
        "summary": summary,
        "original_length": original_length,
        "summary_length": summary_length,
    }


def _chunk_text(text: str, max_words: int) -> list[str]:
    """Split text into chunks at paragraph boundaries."""
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk: list[str] = []
    current_words = 0

    for para in paragraphs:
        para_words = len(para.split())
        if current_words + para_words > max_words and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = []
            current_words = 0
        current_chunk.append(para)
        current_words += para_words

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks if chunks else [text]
