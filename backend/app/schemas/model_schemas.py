from pydantic import BaseModel, Field
from typing import Dict, Any

class TrainRequest(BaseModel):
    disease: str = Field(default='diabetes')
    force_retrain: bool = Field(default=False)

class TrainResponse(BaseModel):
    status: str
    disease: str
    metrics: Dict[str, Any]
    experiment_id: int
    model_version_id: int
    data_hash: str
    data_info: Dict[str, Any]

class ModelComparisonResponse(BaseModel):
    classical: Dict[str, Any]
    quantum: Dict[str, Any]
    hybrid: Dict[str, Any]
    improvement: Dict[str, float]
