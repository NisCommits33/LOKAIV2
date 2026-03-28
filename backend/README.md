# LokAI AI Processing Backend

FastAPI microservice that provides:

- **OCR**: PDF text extraction via Tesseract (English + Nepali)
- **Summarization**: Text summarization using `facebook/bart-large-cnn`
- **Question Generation**: MCQ generation using `valhalla/t5-small-qg-hl`

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

# Install Poppler (for pdf2image)
# Windows: https://github.com/oschwartz10612/poppler-windows/releases
# Add bin/ to PATH

# Copy environment variables
copy .env.example .env

# Run
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Service health check |
| POST | /api/ai/ocr | Extract text from PDF |
| POST | /api/ai/summarize | Summarize text |
| POST | /api/ai/questions | Generate MCQs from text |
| POST | /api/ai/process | Full pipeline: OCR → Summarize → Generate Questions |

