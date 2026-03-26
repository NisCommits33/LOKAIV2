"""
schemas.py — Pydantic Request/Response Models

Defines typed models for API request validation and response serialization.
"""

from pydantic import BaseModel, Field


# ── OCR ─────────────────────────────────────────────────────
class OCRRequest(BaseModel):
    file_base64: str = Field(..., description="Base64-encoded PDF file")
    language: str = Field(default="eng", description="Tesseract language code: eng, nep, eng+nep")


class OCRResponse(BaseModel):
    text: str
    page_count: int
    language: str
    confidence: float = Field(default=0.0, description="Average OCR confidence (0-100)")


# ── Summarization ───────────────────────────────────────────
class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=50, description="Text to summarize")
    max_length: int = Field(default=200, ge=50, le=500)
    min_length: int = Field(default=50, ge=20, le=200)
    engine: str = Field(default="local", pattern="^(local|groq)$")


class SummarizeResponse(BaseModel):
    summary: str
    original_length: int
    summary_length: int


# ── Question Generation ─────────────────────────────────────
class QuestionRequest(BaseModel):
    text: str = Field(..., min_length=50, description="Source text for question generation")
    count: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    engine: str = Field(default="local", pattern="^(local|groq)$")


class GeneratedQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_answer: int = Field(ge=0, le=3)
    explanation: str


class QuestionResponse(BaseModel):
    questions: list[GeneratedQuestion]
    source_length: int


# ── Full Pipeline ───────────────────────────────────────────
class ProcessRequest(BaseModel):
    doc_id: str = Field(..., description="Document ID for progress tracking")
    file_base64: str = Field(..., description="Base64-encoded PDF file")
    language: str = Field(default="eng+nep")
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    engine_preference: str = Field(default="local", pattern="^(local|groq)$")


class ProcessResponse(BaseModel):
    text: str
    page_count: int
    summary: str
    questions: list[GeneratedQuestion]
