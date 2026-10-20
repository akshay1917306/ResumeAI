import sys
import os
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

try:
    from backend.routes.resume import router as resume_router
    from backend.routes.jd import router as jd_router
    from backend.routes.match import router as match_router
    from backend.routes.tailor import router as tailor_router
    from backend.routes.generate import router as generate_router
    from backend.routes.download import router as download_router
except ImportError:
    from routes.resume import router as resume_router
    from routes.jd import router as jd_router
    from routes.match import router as match_router
    from routes.tailor import router as tailor_router
    from routes.generate import router as generate_router
    from routes.download import router as download_router


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# APPLICATION SETTINGS
# ============================================================

APP_NAME = os.getenv(
    "APP_NAME",
    "ResumeAI"
)

APP_VERSION = os.getenv(
    "APP_VERSION",
    "1.0.0"
)


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=APP_NAME,
    description="LLM-powered ResumeAI application",
    version=APP_VERSION
)


# ============================================================
# CORS - Robust Browser Compatibility
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "null"
    ],
    allow_origin_regex=r"http://(127\.0\.0\.1|localhost)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(resume_router)
app.include_router(jd_router)
app.include_router(match_router)
app.include_router(tailor_router)
app.include_router(generate_router)
app.include_router(download_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "ResumeAI API is running",
        "version": APP_VERSION
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": APP_NAME
    }