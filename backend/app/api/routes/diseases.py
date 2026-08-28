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
