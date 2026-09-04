from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.disease import DiseaseListResponse, DiseaseInfo
from app.datasets.loader import DatasetLoader, get_dataset_loader

router = APIRouter()

@router.get(
    "",
    response_model=DiseaseListResponse,
    summary="List Supported Disease Modules",
    description="Returns metadata, feature schemas, parameter ranges, and training status for all available disease modules."
)
async def list_diseases(loader: DatasetLoader = Depends(get_dataset_loader)):
    return {"diseases": loader.list_diseases()}

@router.get(
    "/{disease_id}",
    response_model=DiseaseInfo,
    summary="Get Specific Disease Module Details",
    description="Returns feature definitions, valid ranges, units, and dataset statistics for a given disease ID."
)
async def get_disease(disease_id: str, loader: DatasetLoader = Depends(get_dataset_loader)):
    try:
        return loader.get_disease_info(disease_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{disease_id}' is not supported: {str(e)}"
        )


@router.get(
    "/{disease_id}/samples",
    summary="Get Raw Dataset Clinical Records",
    description="Inspect raw patient records directly from the verified dataset (supports limit 1-100)."
)
async def get_disease_samples(
    disease_id: str,
    limit: int = 10,
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        X, y, feature_cols = loader.load(disease_id)
        disease_info = loader.get_disease_info(disease_id)
        limit = min(max(1, limit), len(X), 100)
        samples = []
        for i in range(limit):
            row_dict = {col: round(float(X[i][j]), 4) for j, col in enumerate(feature_cols)}
            row_dict["target"] = int(y[i])
            samples.append(row_dict)

        return {
            "disease": disease_id,
            "disease_name": disease_info.get("name", disease_id),
            "total_records": len(X),
            "features_count": len(feature_cols),
            "features": feature_cols,
            "sample_records": samples
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{disease_id}' is not supported: {str(e)}"
        )

