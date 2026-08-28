from typing import Literal, List
from pydantic import BaseModel, ConfigDict, Field

class ModelMetrics(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_name: str = Field(..., description="Model architecture name")
    model_type: Literal["classical", "quantum", "hybrid"] = Field(..., description="Model category")
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Overall classification accuracy")
    precision: float = Field(..., ge=0.0, le=1.0, description="Precision (Positive Predictive Value)")
    recall: float = Field(..., ge=0.0, le=1.0, description="Recall / Sensitivity (True Positive Rate)")
    f1_score: float = Field(..., ge=0.0, le=1.0, description="Harmonic mean of precision and recall")
    roc_auc: float = Field(..., ge=0.0, le=1.0, description="Area under ROC curve")
    training_time_s: float = Field(..., ge=0.0, description="Training duration in seconds")
    inference_time_ms: float = Field(..., ge=0.0, description="Single-sample inference latency in milliseconds")
    confusion_matrix: List[List[int]] = Field(..., description="2x2 confusion matrix [[TN, FP], [FN, TP]]")

class ModelComparisonResponse(BaseModel):
    disease: str = Field(..., description="Disease module evaluated")
    models: List[ModelMetrics] = Field(..., description="List of comparative model evaluation metrics")
    winner: str = Field(..., description="Top performing architecture")
    verdict: Literal["hybrid_better", "classical_better", "similar_performance", "further_research_required"] = Field(
        ..., description="Scientific comparative verdict code"
    )
    verdict_explanation: str = Field(..., description="Detailed explanation of empirical comparison results")
