# LokAI AI Processing — Dockerfile
# Tesseract OCR (English + Nepali) + Python AI models

FROM python:3.11-slim

# System deps: Tesseract OCR, Poppler (pdf2image), fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-nep \
    poppler-utils \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download AI models during build (avoids cold-start delay)
RUN python -c "\
from transformers import pipeline; \
pipeline('summarization', model='facebook/bart-large-cnn'); \
pipeline('text2text-generation', model='valhalla/t5-small-qg-hl'); \
print('Models cached successfully')"

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
