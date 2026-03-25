"""
main.py — FastAPI Application Entry Point

Configures the app with CORS, rate limiting, error handling,
structured logging, and route registration.
"""

import time
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.routes import health, ocr, summarize, questions, process

# ── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("lokai")

# ── Rate Limiter ────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Startup / Shutdown ──────────────────────────────────────
startup_time: float = 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    global startup_time
    startup_time = time.time()
    logger.info("LokAI AI backend starting...")
    yield
    logger.info("LokAI AI backend shutting down.")


# ── App ─────────────────────────────────────────────────────
app = FastAPI(
    title="LokAI AI Processing",
    description="OCR, summarization, and question generation microservice",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request ID Middleware ───────────────────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000)
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} → {response.status_code} ({elapsed}ms)"
    )
    response.headers["X-Request-ID"] = request_id
    return response


# ── Global Error Handlers ──────────────────────────────────
@app.exception_handler(400)
async def bad_request_handler(request: Request, exc):
    return JSONResponse(status_code=400, content={"error": str(exc.detail)})


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Not found"})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    logger.error(f"Internal error: {exc}")
    return JSONResponse(
        status_code=500, content={"error": "Internal server error"}
    )


# ── Routes ──────────────────────────────────────────────────
app.include_router(health.router, tags=["Health"])
app.include_router(ocr.router, prefix="/api/ai", tags=["OCR"])
app.include_router(summarize.router, prefix="/api/ai", tags=["Summarization"])
app.include_router(questions.router, prefix="/api/ai", tags=["Questions"])
app.include_router(process.router, prefix="/api/ai", tags=["Pipeline"])
