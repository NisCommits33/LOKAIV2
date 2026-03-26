"""
utils/supabase.py — Supabase Client Utility

Provides a centralized Supabase client for backend services to interact
with the database using the service role key for admin-level access.
"""

import logging
from supabase import create_client, Client
from app.config import get_settings

logger = logging.getLogger("lokai.utils.supabase")
settings = get_settings()

def get_supabase_client() -> Client:
    """
    Initialize and return a Supabase client.
    """
    if not settings.supabase_url or not settings.supabase_service_key:
        logger.error("Supabase URL or Service Key missing in configuration")
        raise ValueError("Supabase configuration missing")
        
    return create_client(settings.supabase_url, settings.supabase_service_key)
