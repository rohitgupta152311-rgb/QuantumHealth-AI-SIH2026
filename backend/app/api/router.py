from fastapi import APIRouter
from app.api.routes import health, diseases, predict, models, quantum, experiments, clinical_evidence, chat, firebase
from app.api.v1.endpoints import datasets as datasets_v1, models as models_v1

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(diseases.router, prefix="/diseases", tags=["diseases"])
api_router.include_router(predict.router, prefix="/predict", tags=["prediction"])
api_router.include_router(models_v1.router, prefix="/v1/models", tags=["models-v1"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(quantum.router, prefix="/quantum", tags=["quantum"])
api_router.include_router(experiments.router, prefix="/experiments", tags=["experiments"])
api_router.include_router(clinical_evidence.router, prefix="/clinical-evidence", tags=["clinical-evidence"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(firebase.router, prefix="/firebase", tags=["firebase"])

# Extended endpoints: dataset upload + model training with uploads
api_router.include_router(datasets_v1.router, prefix="/datasets", tags=["datasets"])
