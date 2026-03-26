"""
services/summarization_service.py — Text Summarization Service

Uses facebook/bart-large-cnn to produce extractive summaries.
Handles long texts by chunking at paragraph boundaries.
"""

import logging
import re
from transformers import pipeline

from app.config import get_settings
from app.services.groq_service import summarize_with_groq

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


def summarize_text(text: str, max_length: int = 200, min_length: int = 50, engine: str = "local") -> dict:
    """
    Summarize the given text using a chunked recursive approach for long documents.
    Supports 'local' (BART) or 'groq'.
    """
    if engine == "groq":
        return summarize_with_groq(text)
        
    summarizer = _get_summarizer()
    original_length = len(text.split())
    
    # 1. Chunking: split text into manageable pieces (~600 words each)
    chunks = _chunk_text(text, max_words=600)
    
    if len(chunks) > 1:
        logger.info(f"Summarizing {len(chunks)} chunks for long document...")
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            if i % 10 == 0 or i == len(chunks) - 1:
                logger.info(f"Processing chunk {i+1}/{len(chunks)}...")
            try:
                # Summarize each chunk with smaller limits
                res = summarizer(chunk, max_length=120, min_length=30, truncation=True)
                chunk_summaries.append(res[0]["summary_text"])
            except Exception as e:
                logger.warning(f"Failed to summarize chunk {i}: {e}")
                chunk_summaries.append(" ".join(chunk.split()[:50]))
        
        # Combine chunk summaries
        combined_text = " ".join(chunk_summaries)
        # Summarize the combination to get final summary
        try:
            input_words = len(combined_text.split())
            safe_max = min(max_length, max(input_words - 5, 20))
            safe_min = min(min_length, safe_max - 5, 15)
            
            result = summarizer(
                combined_text,
                max_length=safe_max,
                min_length=safe_min,
                do_sample=False,
                truncation=True,
            )
            summary = result[0]["summary_text"]
        except:
            summary = combined_text[:max_length*5] # Fallback
    else:
        # Single chunk (short document)
        input_words = len(text.split())
        safe_max = min(max_length, max(input_words - 5, 20))
        safe_min = min(min_length, safe_max - 5, 15)
        
        try:
            result = summarizer(
                text,
                max_length=safe_max,
                min_length=safe_min,
                do_sample=False,
                truncation=True,
            )
            summary = result[0]["summary_text"]
        except Exception as e:
            logger.warning(f"Summarization error: {e}")
            summary = " ".join(text.split()[:max_length])

    summary_length = len(summary.split())
    logger.info(f"Summarized {original_length} → {summary_length} words")

    return {
        "summary": summary,
        "original_length": original_length,
        "summary_length": summary_length,
    }


def _chunk_text(text: str, max_words: int = 600) -> list[str]:
    """Split text into chunks of roughly max_words, preserving sentence boundaries."""
    # Split by sentences first
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current_chunk = []
    current_words = 0
    
    for sentence in sentences:
        words = sentence.split()
        if not words: continue
        
        sentence_word_count = len(words)
        # If adding this sentence exceeds max_words, start a new chunk
        if current_words + sentence_word_count > max_words and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_words = 0
            
        current_chunk.append(sentence)
        current_words += sentence_word_count
        
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks if chunks else [text]
