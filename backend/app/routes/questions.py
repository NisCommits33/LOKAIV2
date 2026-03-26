"""
routes/questions.py — Question Generation Endpoint

POST /api/ai/questions
Accepts text and generates multiple-choice questions.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.schemas import QuestionRequest, QuestionResponse
from app.services.question_service import generate_questions

logger = logging.getLogger("lokai.routes.questions")
router = APIRouter()


@router.post("/questions", response_model=QuestionResponse)
async def questions_endpoint(req: QuestionRequest):
    try:
        result = generate_questions(req.text, req.count, req.difficulty, req.engine)
        return QuestionResponse(**result)
    except Exception as e:
        logger.error(f"Question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")
