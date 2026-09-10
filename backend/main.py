import sys
import time
import asyncio
import logging
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base, run_sqlite_migrations
from app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logging.getLogger("aiosqlite").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logger = logging.getLogger("quantumhealth.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing QuantumHealth AI database and models cache...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await run_sqlite_migrations(engine)
        logger.info("SQLite database tables and migrations verified successfully.")
    except Exception as e:
        logger.warning(f"Database initialization note: {e}")

    # Initialize Firebase manager (Dual-mode: Cloud Firestore or Local PHC fallback)
    try:
        from app.core.firebase import firebase_manager
        firebase_manager.initialize()
        fb_status = firebase_manager.get_status()
        logger.info(
            f"Firebase initialized: mode='{fb_status['mode']}', project_id='{fb_status['project_id']}'"
        )
    except Exception as e:
        logger.warning(f"Firebase initialization note: {e}")

    # Non-blocking background pre-warm of disease models and circuits
    async def _prewarm_models():
        try:
            from app.api.routes.predict import get_prediction_service
            pred_service = get_prediction_service()
            for disease in ["diabetes", "heart", "kidney", "breast_cancer"]:
                await pred_service.get_or_train_models(disease)
            logger.info("All 4 disease models and quantum circuits ready. Models: RF(300/8), SVM, LR, HistGradientBoosting, XGBoost.")
        except Exception as e:
            logger.warning(f"Model background warm-up note: {e}")

    asyncio.create_task(_prewarm_models())

    yield


    # Shutdown
    logger.info("Shutting down QuantumHealth AI services...")
    await engine.dispose()

app = FastAPI(
    title="QuantumHealth AI Platform API",
    version=settings.app_version,
    description=(
        "### Hybrid Quantum-Classical Machine Learning Platform for Early Disease Detection\n\n"
        "**Smart India Hackathon (SIH) 2026** — Problem Statement **#26139**\n\n"
        "- **Organization:** Egreen Quanta\n"
        "- **Category:** Software / MedTech / BioTech / HealthTech\n"
        "- **Architecture:** Classical Ensemble (RF, SVM, LR, XGBoost, HistGradientBoosting) + PennyLane VQC with Data Re-uploading\n"
        "- **Simulator:** `pennylane:default.qubit` (Angle Encoding with Ring CNOT Entanglement)\n\n"
        "*(Note: All quantum computations run in Quantum Simulation Mode. Models: RF(300/8), SVM, LR, HistGradientBoosting, XGBoost)*"
    ),
    openapi_tags=[
        {"name": "health", "description": "System health and quantum simulator backend verification."},
        {"name": "diseases", "description": "Disease module catalog, biomarker specifications, and parameter ranges."},
        {"name": "predict", "description": "Hybrid disease prediction pipeline and consensus decision engine."},
        {"name": "models", "description": "Comparative benchmarking, training triggers, and accuracy evaluations."},
        {"name": "quantum", "description": "Quantum circuit architecture, qubit wire mapping, and gate specs."},
        {"name": "experiments", "description": "Historical diagnostic audits and experiment logging."},
        {"name": "firebase", "description": "Cloud Firestore persistence, audit syncing, and Firebase Auth verification."}
    ],
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"(http://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.web\.app|https://.*\.firebaseapp\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import uuid

# Process timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    response.headers["X-Request-ID"] = request_id
    return response

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
