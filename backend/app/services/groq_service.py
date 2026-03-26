import logging
import json
import os
from groq import Groq
from app.config import get_settings

logger = logging.getLogger("lokai.services.groq")
settings = get_settings()

# We use Llama 3.3 70B for high-quality, high-speed reasoning
GROQ_MODEL = "llama-3.3-70b-versatile"

def _get_client():
    if not settings.groq_api_key:
        raise Exception("Groq API Key not configured")
    return Groq(api_key=settings.groq_api_key)

def summarize_with_groq(text: str) -> dict:
    """Uses Groq to create an instant, high-quality summary."""
    try:
        client = _get_client()
        prompt = f"Summarize the following text professionally and comprehensively:\n\n{text[:30000]}"
        
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional academic summarizer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=1024
        )
        
        summary = completion.choices[0].message.content
        return {
            "summary": summary,
            "original_length": len(text.split()),
            "summary_length": len(summary.split())
        }
    except Exception as e:
        logger.error(f"Groq summarization failed: {e}")
        return {"summary": "Groq summarization failed. Falling back to local summary."}

def generate_questions_with_groq(text: str, count: int = 5, difficulty: str = "medium") -> dict:
    """Generates high-quality MCQs instantly using Groq."""
    try:
        client = _get_client()
        prompt = f"""
        Generate {count} multiple-choice questions (MCQs) based on the text provided below.
        Difficulty level: {difficulty}.
        
        Format the response as a JSON object containing a single key "questions" mapping to an array of objects.
        Each object in the array MUST have exactly these keys:
        - "id": a unique string (e.g., "q1", "q2")
        - "question": the actual question text
        - "options": an array of 4 distinct strings
        - "correct_answer": the integer index (0-3) of the correct option
        - "explanation": a detailed explanation of why the answer is correct
        
        Output ONLY valid JSON. Do not include any introductory text.
        
        Text:
        {text[:20000]}
        """
        
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert educational content generator. You output ONLY JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        
        # Parse JSON
        try:
            data = json.loads(content)
            source_length = len(text.split())
            
            questions_list = []
            
            # Extract the actual list of questions
            if isinstance(data, dict):
                questions_list = data.get("questions", [])
                if not questions_list:
                    # Look for ANY list in the dictionary values
                    for val in data.values():
                        if isinstance(val, list):
                            questions_list = val
                            break
            elif isinstance(data, list):
                questions_list = data
                
            return {"questions": questions_list, "source_length": source_length}
        except Exception as parse_err:
            logger.error(f"Failed to parse Groq JSON: {parse_err}")
            # Fallback parsing for common formatting errors
            if "[" in content:
                content = content[content.find("["):content.rfind("]")+1]
                return {
                    "questions": json.loads(content),
                    "source_length": len(text.split())
                }
            raise parse_err

    except Exception as e:
        logger.error(f"Groq question generation failed: {e}")
        raise Exception(f"Groq QG Error: {str(e)}")
