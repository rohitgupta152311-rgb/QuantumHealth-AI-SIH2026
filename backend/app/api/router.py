from fastapi import APIRouter
from app.api.routes import health, diseases, predict, models, quantum, experiments

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(diseases.router, prefix="/diseases", tags=["diseases"])
api_router.include_router(predict.router, prefix="/predict", tags=["prediction"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(quantum.router, prefix="/quantum", tags=["quantum"])
api_router.include_router(experiments.router, prefix="/experiments", tags=["experiments"])
