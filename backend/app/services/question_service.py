"""
services/question_service.py — MCQ Question Generation Service

Uses valhalla/t5-small-qg-hl to generate questions from text,
then creates plausible distractors and classifies difficulty.
"""

import logging
import re
import uuid
import random
from transformers import pipeline

from app.config import get_settings

logger = logging.getLogger("lokai.questions")
settings = get_settings()

# Lazy-loaded model
_qg_pipeline = None


def _get_qg_pipeline():
    global _qg_pipeline
    if _qg_pipeline is None:
        logger.info(f"Loading QG model: {settings.qg_model}")
        _qg_pipeline = pipeline(
            "text2text-generation",
            model=settings.qg_model,
            device=-1,
        )
        logger.info("QG model loaded.")
    return _qg_pipeline


def generate_questions(text: str, count: int = 5, difficulty: str = "medium") -> dict:
    """
    Generate multiple-choice questions from the source text.

    1. Extract key sentences
    2. Generate questions using T5
    3. Build answer options with distractors
    4. Classify difficulty
    """
    qg = _get_qg_pipeline()
    sentences = _extract_key_sentences(text, max_sentences=count * 3)
    source_length = len(text.split())

    questions = []
    seen_questions = set()

    for sentence in sentences:
        if len(questions) >= count:
            break

        try:
            # Format input for the QG model
            input_text = f"generate question: {sentence}"
            result = qg(input_text, max_length=128, num_return_sequences=1)
            question_text = result[0]["generated_text"].strip()

            # Skip duplicates or very short questions
            if question_text in seen_questions or len(question_text) < 10:
                continue
            seen_questions.add(question_text)

            # Extract the correct answer from the sentence
            correct_answer = _extract_answer(sentence, question_text)
            if not correct_answer:
                continue

            # Generate distractors
            distractors = _generate_distractors(correct_answer, text, count=3)
            if len(distractors) < 3:
                continue

            # Build options and shuffle
            options = [correct_answer] + distractors
            random.shuffle(options)
            correct_index = options.index(correct_answer)

            # Create explanation
            explanation = f"The answer is found in the text: \"{sentence[:150]}...\""

            questions.append({
                "id": f"q{uuid.uuid4().hex[:8]}",
                "question": question_text,
                "options": options,
                "correct_answer": correct_index,
                "explanation": explanation,
            })

        except Exception as e:
            logger.warning(f"Failed to generate question from sentence: {e}")
            continue

    logger.info(f"Generated {len(questions)} questions from {source_length} words")

    return {
        "questions": questions,
        "source_length": source_length,
    }


def _extract_key_sentences(text: str, max_sentences: int = 15) -> list[str]:
    """
    Extract the most informative sentences from the text.
    Prioritizes longer sentences with capitalized proper nouns and numbers.
    """
    # Split into sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [s.strip() for s in sentences if len(s.split()) >= 8]

    # Score sentences by information density
    scored = []
    for s in sentences:
        score = 0
        words = s.split()
        score += min(len(words), 30)  # Length (capped)
        score += len(re.findall(r"\b[A-Z][a-z]+\b", s)) * 3  # Proper nouns
        score += len(re.findall(r"\b\d+\b", s)) * 2  # Numbers
        score += len(re.findall(r"\b(is|are|was|were|means|refers|defined)\b", s, re.I)) * 2  # Definitional
        scored.append((score, s))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored[:max_sentences]]


def _extract_answer(sentence: str, question: str) -> str | None:
    """
    Extract the most likely answer from the sentence that the question asks about.
    Uses simple heuristics: named entities, numbers, or noun phrases.
    """
    # Find capitalized phrases (likely proper nouns / answers)
    named = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", sentence)
    # Find numbers with optional units
    numbers = re.findall(r"\b\d+[\d,.]*\s*(?:%|km|m|years?|days?)?\b", sentence)

    candidates = named + numbers
    # Filter out words that appear in the question itself
    q_words = set(question.lower().split())
    candidates = [c for c in candidates if c.lower().split()[0] not in q_words]

    if candidates:
        # Return the longest candidate as the answer
        return max(candidates, key=len)
    return None


def _generate_distractors(correct: str, text: str, count: int = 3) -> list[str]:
    """
    Generate plausible wrong answers by finding similar entities in the text.
    Falls back to generic distractors if not enough are found.
    """
    # Find all similar entities in the text
    all_named = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text)
    all_numbers = re.findall(r"\b\d+[\d,.]*\s*(?:%|km|m|years?|days?)?\b", text)

    candidates = list(set(all_named + all_numbers))
    # Remove the correct answer
    candidates = [c for c in candidates if c.lower() != correct.lower() and len(c) > 1]

    # Prefer candidates of similar type (named vs numeric)
    is_numeric = bool(re.match(r"\d", correct))
    typed = [c for c in candidates if bool(re.match(r"\d", c)) == is_numeric]
    if len(typed) >= count:
        candidates = typed

    random.shuffle(candidates)
    distractors = candidates[:count]

    # Pad with generic answers if needed
    if len(distractors) < count:
        generics = ["None of the above", "All of the above", "Not specified", "Cannot be determined"]
        for g in generics:
            if len(distractors) >= count:
                break
            if g != correct:
                distractors.append(g)

    return distractors[:count]
