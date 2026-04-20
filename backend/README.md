# LokAI AI Processing Backend

FastAPI microservice that provides a dual-engine AI architecture:

- **OCR**: PDF text extraction via Tesseract (English + Nepali)
- **Summarization**: 
  - *Cloud Fast-Path*: `llama-3.3-70b-versatile` via Groq LPU (Default)
  - *Local Fallback*: `facebook/bart-large-cnn` (Local HuggingFace)
- **Question Generation**: 
  - *Cloud Fast-Path*: `llama-3.3-70b-versatile` via Groq LPU (Default)
  - *Local Fallback*: `valhalla/t5-small-qg-hl` (Local HuggingFace)

## Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR
# Windows: https://github.com/tesseract-ocr/tesseract/releases
# Add to PATH and set TESSERACT_CMD in .env

# Copy environment variables
copy .env.example .env

# Run
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

All generation endpoints accept an optional `engine` parameter (`"groq"` or `"local"`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| POST | `/api/ai/ocr` | Extract text from PDF |
| POST | `/api/ai/summarize` | Summarize text (Pass `engine="groq"` or `"local"`) |
| POST | `/api/ai/questions` | Generate MCQs (Pass `engine="groq"` or `"local"`) |
| POST | `/api/ai/process` | Full pipeline: OCR → Summarize → Questions |

