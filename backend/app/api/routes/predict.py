import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService
from app.datasets.loader import get_dataset_loader, DatasetLoader
from app.core.config import settings

logger = logging.getLogger("quantumhealth.api.predict")
router = APIRouter()

_global_prediction_service = None

def get_prediction_service() -> PredictionService:
    global _global_prediction_service
    if _global_prediction_service is None:
        loader = get_dataset_loader()
        _global_prediction_service = PredictionService(loader, settings.models_cache_dir)
    return _global_prediction_service


@router.post(
    "",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Hybrid Quantum-Classical Disease Prediction",
    description=(
        "Ingests patient biomarker features, applies normalizer & SelectKBest, "
        "executes classical ensemble and PennyLane VQC simulation, and synthesizes "
        "a calibrated consensus risk assessment."
    )
)
async def predict(
    request: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        disease_info = loader.get_disease_info(request.disease)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{request.disease}' not found: {str(e)}"
        )

    # Validate feature presence
    required_features = {f["name"] for f in disease_info["features"]}
    provided_features = set(request.features.keys())
    missing = required_features - provided_features
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required clinical features for {request.disease}: {sorted(list(missing))}"
        )

    try:
        logger.info(f"Executing prediction for disease '{request.disease}' with mode '{request.mode}'")
        result = await service.predict(request.disease, request.features, mode=request.mode)
        return result
    except Exception as e:
        logger.error(f"Prediction error for {request.disease}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnostic pipeline execution failed: {str(e)}"
        )
