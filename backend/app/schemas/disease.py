from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel

DiseaseID = Literal["diabetes", "heart", "breast_cancer", "kidney"]

class FeatureInfo(BaseModel):
    name: str
    label: str
    unit: Optional[str] = None
    min_val: float
    max_val: float
    description: str
    missing_sentinels: Optional[List[float]] = []
    required: Optional[bool] = True

class DiseaseInfo(BaseModel):
    id: str
    name: str
    description: str
    features: List[FeatureInfo]
    dataset_size: int
    status: Literal["ready", "training", "not_trained"] = "ready"
    source: Optional[str] = None
    source_citation: Optional[str] = None
    source_url: Optional[str] = None
    dataset_license: Optional[str] = None
    is_synthetic_demonstration: Optional[bool] = False
    evaluation_protocol: Optional[str] = None
    presets: Optional[Dict[str, Any]] = None

class DiseaseListResponse(BaseModel):
    diseases: List[DiseaseInfo]
