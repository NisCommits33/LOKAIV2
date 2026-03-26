"""
services/chapter_service.py — Document Segmentation Service

Identifies chapters and sections within extracted text using regex patterns
and semantic heuristics.
"""

import re
import logging

logger = logging.getLogger("lokai.chapters")

def extract_chapters(text: str) -> list[dict]:
    """
    Splits document text into logical chapters/sections.
    Returns a list of {"title": str, "content": str}.
    """
    if not text:
        return []

    # Common patterns for academic/professional document headers
    # 1. "Chapter X", "Section X", "Part X"
    # 2. "1. Introduction", "2. Background" (Numeric)
    # 3. All-caps headers on their own line
    
    # regex for "Chapter 1", "CHAPTER ONE", "Section 2.1", "1.1 Introduction"
    patterns = [
        r"^(?:CHAPTER|Chapter|SECTION|Section|PART|Part)\s+[0-9A-Z]+(?:\.[0-9]+)*",
        r"^[0-9]+(?:\.[0-9]+)+\s+[A-Z][a-z]+", # 1.1 Heading
        r"^[0-9]+\.\s+[A-Z][A-Z\s]+$" # 1. INTRODUCTION (All caps)
    ]
    
    combined_pattern = "|".join(patterns)
    
    # Find all matches and their positions
    matches = list(re.finditer(combined_pattern, text, flags=re.MULTILINE))
    
    if not matches:
        logger.info("No chapter markers found. Returning full document as single chapter.")
        return [{"title": "Full Document", "content": text}]
    
    chapters = []
    
    # Handle the "Preamble" (text before the first chapter)
    first_match = matches[0]
    if first_match.start() > 50: # Only if there's significant text
        preamble = text[:first_match.start()].strip()
        if preamble:
            chapters.append({"title": "Introduction/Preamble", "content": preamble})
    
    # Iterate through matches to split content
    for i in range(len(matches)):
        start_pos = matches[i].start()
        end_pos = matches[i+1].start() if i + 1 < len(matches) else len(text)
        
        # Extract title (first line of the match)
        full_match_text = text[start_pos:end_pos].strip()
        title_line = full_match_text.split("\n")[0].strip()
        
        # Clean numeric titles like "1.1 Introduction" -> "1.1 Introduction"
        # but if it's just "Chapter 1", take the next line too if it looks like a title
        lines = [l for l in full_match_text.split("\n") if l.strip()]
        if len(lines) > 1 and len(title_line) < 15:
            # If title is short (like "Chapter 1"), append the next line
            # but only if the next line isn't a paragraph
            if len(lines[1]) < 50:
                title_line = f"{title_line}: {lines[1].strip()}"
        
        content = full_match_text.strip()
        
        if len(content) > 100: # Ignore tiny/empty sections
            chapters.append({
                "title": title_line,
                "content": content
            })
            
    logger.info(f"Identified {len(chapters)} chapters in document.")
    return chapters
