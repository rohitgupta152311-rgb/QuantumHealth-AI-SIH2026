from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.core.config import settings

router = APIRouter()

class HealthResponse(BaseModel):
    status: str = Field("ok", description="Server operational status")
    version: str = Field(settings.app_version, description="Platform version")
    quantum_backend: str = Field(settings.quantum_backend, description="Active Quantum simulator backend")
    simulation_mode: bool = Field(True, description="Indicates simulation execution mode")

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health & Quantum Backend Status",
    description="Returns backend connectivity status, system version, and active PennyLane simulator device."
)
async def health_check():
    return {
        "status": "ok",
        "version": settings.app_version,
        "quantum_backend": settings.quantum_backend,
        "simulation_mode": True,
    }
