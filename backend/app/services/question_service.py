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
from app.services.groq_service import generate_questions_with_groq

logger = logging.getLogger("lokai.questions")
settings = get_settings()

# Lazy-loaded models
_qg_pipeline = None
_ner_pipeline = None


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


def _get_ner_pipeline():
    global _ner_pipeline
    if _ner_pipeline is None:
        logger.info("Loading NER model: dbmdz/bert-large-cased-finetuned-conll03-english")
        _ner_pipeline = pipeline(
            "ner",
            model="dbmdz/bert-large-cased-finetuned-conll03-english",
            aggregation_strategy="simple",
            device=-1,
        )
        logger.info("NER model loaded.")
    return _ner_pipeline


def generate_questions(text: str, count: int = 5, difficulty: str = "medium", engine: str = "local") -> dict:
    """
    Generate MCQs based on the provided text.
    Supports 'local' (T5) or 'groq'.
    """
    if engine == "groq":
        return generate_questions_with_groq(text, count, difficulty)
        
    global _qg_pipeline
    """
    Generate multiple-choice questions from the source text using AI context.
    """
    qg = _get_qg_pipeline()
    ner = _get_ner_pipeline()
    
    # 1. AI Analysis: Find key entities (Persons, Orgs, Locs)
    entities = ner(text)
    # Group and filter unique entities by high confidence
    unique_entities = {}
    for ent in entities:
        if ent['score'] > 0.8:
            word = ent['word'].strip()
            if len(word) > 2 and word not in unique_entities:
                unique_entities[word] = ent['entity_group']
    
    # 2. Extract and window sentences
    raw_sentences = re.split(r"(?<=[.!?])\s+", text)
    raw_sentences = [s.strip() for s in raw_sentences if len(s.split()) >= 4]

    questions = []
    seen_questions = set()
    
    # 3. For each significant entity, try to generate a question
    # Sort entities by those that appear in longer sentences
    entity_list = list(unique_entities.keys())
    random.shuffle(entity_list)
    
    for entity in entity_list:
        if len(questions) >= count:
            break
            
        # Find sentences containing this entity
        target_indices = [i for i, s in enumerate(raw_sentences) if entity in s]
        if not target_indices: continue
        
        idx = target_indices[0] # Take first occurrence
        target_sentence = raw_sentences[idx]
        
        # Create context window (1 sentence before and after)
        start = max(0, idx - 1)
        end = min(len(raw_sentences), idx + 2)
        window = raw_sentences[start:end]
        
        # Highlight entity in the target sentence for T5
        # Some T5 QG models use <hl> entity <hl> sentence
        # Others just need the entity and context
        highlighted_sentence = target_sentence.replace(entity, f"<hl> {entity} <hl>")
        context_text = " ".join(window).replace(target_sentence, highlighted_sentence)
        
        try:
            # Generate question
            input_text = f"generate question: {context_text}"
            result = qg(input_text, max_length=128, num_return_sequences=1)
            question_text = result[0]["generated_text"].strip()

            if question_text in seen_questions or len(question_text) < 12:
                continue
            
            # Generate distractors based on entity type
            ent_type = unique_entities[entity]
            distractors = _generate_distractors_v2(entity, text, ent_type, count=3)
            
            if len(distractors) < 3: continue
            
            options = [entity] + distractors
            random.shuffle(options)
            correct_index = options.index(entity)
            seen_questions.add(question_text)
            
            questions.append({
                "id": f"q{uuid.uuid4().hex[:8]}",
                "question": question_text,
                "options": options,
                "correct_answer": correct_index,
                "explanation": f"The answer is {entity}. Context: \"{target_sentence}\"",
            })

        except Exception as e:
            logger.warning(f"Failed to generate question for entity {entity}: {e}")
            continue

    # 4. Fallback: If not enough questions from entities, use old sentence-based method
    if len(questions) < count:
        logger.info("Falling back to sentence-based QG for remaining slots")
        # (Simplified sentence fallback logic could go here, or just return what we have)
        
    source_length = len(text.split())
    logger.info(f"AI QG produced {len(questions)} questions")
    
    return {
        "questions": questions,
        "source_length": source_length,
    }

def _generate_distractors_v2(correct: str, text: str, entity_type: str, count: int = 3) -> list[str]:
    """
    Generate distractors that match the AI entity type and are semantically close.
    """
    ner = _get_ner_pipeline()
    all_ents = ner(text)
    
    # Find original position of correct answer to calculate proximity
    try:
        correct_pos = text.find(correct)
    except:
        correct_pos = 0
        
    candidates = []
    correct_lower = correct.lower().strip()
    
    for ent in all_ents:
        if ent['entity_group'] == entity_type:
            word = ent['word'].strip()
            # Clean up BERT-style ## tokens
            word = word.replace("##", "")
            if len(word) > 1 and word.lower() != correct_lower:
                # Calculate distance
                dist = abs(ent['start'] - correct_pos)
                candidates.append((dist, word))
                
    # Sort by proximity (closest first)
    candidates.sort()
    
    unique_candidates = []
    seen = {correct_lower}
    for _, word in candidates:
        if word.lower() not in seen:
            unique_candidates.append(word)
            seen.add(word.lower())
            if len(unique_candidates) >= count:
                break
                
    distractors = unique_candidates
    
    # Improved fallback: Use significant nouns from the text if not enough entities
    if len(distractors) < count:
        # Regex for potential nouns (Capitalized or longer technical-looking words)
        matches = re.findall(r"\b[A-Z][a-z]{4,}\b|\b[a-z]{6,}\b", text)
        for m in matches:
            if m.lower() not in seen:
                distractors.append(m)
                seen.add(m.lower())
                if len(distractors) >= count:
                    break
                    
    # Final safety fallback
    while len(distractors) < count:
        distractors.append(f"Option {len(distractors) + 1}")
        
    return distractors[:count]


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


def _generate_distractors(correct: str, text: str, count: int = 3, context_sentence: str = "") -> list[str]:
    """
    Generate context-aware distractors for a quiz question.
    1. Filter out common stop words.
    2. Match entity type (Numeric, Date, Proper Noun).
    3. Prioritize contextual proximity.
    """
    distractors = []
    correct_lower = correct.lower().strip()
    
    # Common English stop words to filter from proper noun candidates
    STOP_WORDS = {
        "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", 
        "at", "from", "by", "for", "with", "about", "against", "between", 
        "into", "through", "during", "before", "after", "above", "below", 
        "to", "of", "in", "on", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "this", "that", "these", "those",
        "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her",
        "their", "our", "its", "lokai", "document", "summary", "extracted"
    }

    def is_valid_name(name: str) -> bool:
        name = name.strip()
        if not name or len(name) < 2: return False
        if name.lower() in STOP_WORDS: return False
        if name.lower() == correct_lower: return False
        return True

    # 1. Determine entity type of the correct answer
    is_numeric = bool(re.search(r"\d", correct))
    is_percentage = "%" in correct
    is_date = bool(re.search(r"\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b", correct))

    # 2. Extract potential candidates from the full text
    if is_percentage:
        candidates = re.findall(r"\b\d+(?:\.\d+)?%\b", text)
    elif is_date:
        candidates = re.findall(r"\b\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b", text)
    elif is_numeric:
        candidates = re.findall(r"\b\d+[\d,.]*\b", text)
    else:
        # Proper Nouns: sequences of capitalized words
        candidates = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text)
        candidates = [c for c in candidates if is_valid_name(c)]

    # 3. Prioritize candidates from the context sentence first
    if context_sentence:
        context_candidates = []
        if is_percentage:
            context_candidates = re.findall(r"\b\d+(?:\.\d+)?%\b", context_sentence)
        elif is_date:
            context_candidates = re.findall(r"\b\d{4}\b", context_sentence) # simplified for context
        elif is_numeric:
            context_candidates = re.findall(r"\b\d+[\d,.]*\b", context_sentence)
        else:
            context_candidates = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", context_sentence)
            context_candidates = [c for c in context_candidates if is_valid_name(c)]
        
        for cc in context_candidates:
            if cc.lower().strip() != correct_lower and cc not in distractors:
                distractors.append(cc)

    # 4. Fill from full text candidates
    random.shuffle(candidates)
    for c in candidates:
        if len(distractors) < count:
            c_clean = c.strip()
            if c_clean.lower() != correct_lower and c_clean not in distractors:
                distractors.append(c_clean)
        else:
            break

    # 5. Semantic/Logical Fallbacks
    fallbacks = [
        "None of the above",
        "All of the above",
        "Insufficient information",
        "Not mentioned in the text"
    ]
    random.shuffle(fallbacks)
    
    for f in fallbacks:
        if len(distractors) < count and f.lower() != correct_lower:
            distractors.append(f)

    return distractors[:count]
