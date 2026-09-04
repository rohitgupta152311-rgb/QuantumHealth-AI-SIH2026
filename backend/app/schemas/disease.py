from typing import Literal, Optional, List
from pydantic import BaseModel

DiseaseID = Literal["diabetes", "heart", "breast_cancer"]

class FeatureInfo(BaseModel):
    name: str
    label: str
    unit: Optional[str] = None
    min_val: float
    max_val: float
    description: str

class DiseaseInfo(BaseModel):
    id: str
    name: str
    description: str
    features: List[FeatureInfo]
    dataset_size: int
    status: Literal["ready", "training", "not_trained"]
    source: Optional[str] = None

class DiseaseListResponse(BaseModel):
    diseases: List[DiseaseInfo]
