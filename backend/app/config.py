"""
config.py — Application Configuration

Loads environment variables via pydantic-settings for type-safe configuration.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""

    # Tesseract
    tesseract_cmd: str = "tesseract"

    # Poppler (for pdf2image)
    poppler_path: str = ""

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Rate Limiting
    rate_limit: str = "100/minute"

    # Cloud AI Keys
    groq_api_key: str = ""

    # Models
    summarization_model: str = "facebook/bart-large-cnn"
    qg_model: str = "valhalla/t5-small-qg-hl"
    max_input_length: int = 2048 # Increase for cloud models

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
