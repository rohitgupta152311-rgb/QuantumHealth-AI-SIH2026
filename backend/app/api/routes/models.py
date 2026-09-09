from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.comparison import ModelComparisonResponse
from app.services.prediction_service import PredictionService
from app.datasets.loader import get_dataset_loader, DatasetLoader
from app.core.config import settings

router = APIRouter()

from app.api.routes.predict import get_prediction_service


@router.get(
    "",
    response_model=list[dict],
    summary="List Supported Model Architectures",
    description="Returns metadata about Classical Ensembles, Quantum VQCs, and Hybrid fusion architectures."
)
async def list_models():
    return [
        {
            "name": "RandomForest",
            "type": "classical",
            "description": "Ensemble learning method with balanced class weighting for tabular biomarkers."
        },
        {
            "name": "SVM",
            "type": "classical",
            "description": "Support Vector Machine with Radial Basis Function (RBF) kernel and probability calibration."
        },
        {
            "name": "LogisticRegression",
            "type": "classical",
            "description": "L2-regularized linear baseline classifier using L-BFGS optimization."
        },
        {
            "name": "Hybrid VQC",
            "type": "hybrid",
            "description": "Variational Quantum Classifier with Angle Encoding, Ring CNOT entanglement, and classical fusion."
        }
    ]

@router.get(
    "/compare",
    response_model=ModelComparisonResponse,
    summary="Retrieve Empirical Model Comparison Benchmarks",
    description="Evaluates all models against the test cohort for a specific disease and returns accuracy, precision, recall, F1, ROC-AUC, and confusion matrices."
)
@router.get(
    "/model-comparison",
    response_model=ModelComparisonResponse,
    summary="Retrieve Empirical Model Comparison Benchmarks (Legacy Alias)",
    description="Evaluates all models against the test cohort for a specific disease and returns accuracy, precision, recall, F1, ROC-AUC, and confusion matrices."
)
async def model_comparison(
    disease: str = "diabetes",
    service: PredictionService = Depends(get_prediction_service),
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        loader.get_disease_info(disease)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown disease module '{disease}': {str(e)}"
        )
    try:
        return await service.get_model_comparison(disease)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model comparison evaluation failed: {str(e)}"
        )


@router.post(
    "/train",
    summary="Train or Retrain Disease Models",
    description="Fits preprocessing pipeline, trains classical ensemble, fits Platt probability calibrators on validation split, and generates signed manifest."
)
async def train_disease_models(
    disease: str = "diabetes",
    service: PredictionService = Depends(get_prediction_service),
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        loader.get_disease_info(disease)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown disease module '{disease}': {str(e)}"
        )
    try:
        await service.get_or_train_models(disease, force_retrain=True)
        return {"status": "trained", "disease": disease}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )

