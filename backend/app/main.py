from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import setup_logging, logger
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.district import router as district_router
from app.api.jobs import router as jobs_router
from app.api.predictions import router as predictions_router
from app.api.upload import router as upload_router
from app.api.projects import router as projects_router
from app.api.suggestions import router as suggestions_router
from app.api.folium_map import router as folium_router
from app.api.chat import router as chat_router
from app.api.forecast import router as forecast_router

# Initialize structured logging
setup_logging()

app = FastAPI(
    title="Urban Heat Intelligence Platform API",
    description="Backend API for Tamil Nadu urban heat hotspot detection and cooling strategies.",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production to match frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(district_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(suggestions_router, prefix="/api/v1")
app.include_router(folium_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(forecast_router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    """Application startup event trigger: sets up DB tables and logs ready state."""
    logger.info("Starting up FastAPI application...")
    init_db()
    logger.info("Startup sequence finished successfully.")

@app.get("/health")
def health_check():
    """Public endpoint to verify API container health status."""
    return {"status": "healthy", "service": "urban-heat-backend"}

# Re-registered routers cleanly


