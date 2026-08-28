import sys
import time
import logging
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("quantumhealth.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing QuantumHealth AI database and models cache...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite database tables verified successfully.")
    except Exception as e:
        logger.warning(f"Database initialization note: {e}")
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
        "- **Architecture:** Classical Ensemble (RF, SVM, LR) + PennyLane Variational Quantum Circuit (VQC)\n"
        "- **Simulator:** `pennylane:default.qubit` (Angle Encoding with Ring CNOT Entanglement)\n\n"
        "*(Note: All quantum computations run in Quantum Simulation Mode.)*"
    ),
    openapi_tags=[
        {"name": "health", "description": "System health and quantum simulator backend verification."},
        {"name": "diseases", "description": "Disease module catalog, biomarker specifications, and parameter ranges."},
        {"name": "predict", "description": "Hybrid disease prediction pipeline and consensus decision engine."},
        {"name": "models", "description": "Comparative benchmarking, training triggers, and accuracy evaluations."},
        {"name": "quantum", "description": "Quantum circuit architecture, qubit wire mapping, and gate specs."},
        {"name": "experiments", "description": "Historical diagnostic audits and experiment logging."}
    ],
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Process timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
