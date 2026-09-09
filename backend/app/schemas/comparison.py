from typing import Literal, List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class ModelMetrics(BaseModel):
    """Metrics evaluated for a specific machine learning model architecture."""
    model_config = ConfigDict(protected_namespaces=(), populate_by_name=True)
    model_name: str = Field(..., alias="name", description="Model architecture name")
    model_type: Literal["classical", "quantum", "hybrid"] = Field(..., description="Model category")
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Overall classification accuracy")
    precision: float = Field(..., ge=0.0, le=1.0, description="Precision (Positive Predictive Value)")
    recall: float = Field(..., ge=0.0, le=1.0, description="Recall / Sensitivity (True Positive Rate)")
    sensitivity: Optional[float] = Field(None, description="Sensitivity / Recall (True Positive Rate)")
    specificity: Optional[float] = Field(None, description="Specificity (True Negative Rate)")
    f1_score: float = Field(..., alias="f1", ge=0.0, le=1.0, description="Harmonic mean of precision and recall")
    roc_auc: float = Field(..., alias="auc", ge=0.0, le=1.0, description="Area under ROC curve")
    pr_auc: Optional[float] = Field(None, description="Precision-Recall Area Under Curve")
    brier_score: Optional[float] = Field(None, description="Brier Score (Mean Squared Calibration Error)")
    calibration_curve: Optional[List[Dict[str, float]]] = Field(None, description="Observed vs predicted calibration curve bins")
    training_time_s: float = Field(..., ge=0.0, description="Training duration in seconds")
    inference_time_ms: float = Field(..., ge=0.0, description="Single-sample inference latency in milliseconds")
    confusion_matrix: List[List[int]] = Field(..., description="2x2 confusion matrix [[TN, FP], [FN, TP]]")

class ModelComparisonResponse(BaseModel):
    """Response schema containing comparative benchmarks across different models."""
    disease: str = Field(..., description="Disease module evaluated")
    models: List[ModelMetrics] = Field(..., description="List of comparative model evaluation metrics")
    winner: str = Field(..., description="Top performing architecture")
    verdict: Literal["hybrid_better", "classical_better", "similar_performance", "further_research_required"] = Field(
        ..., description="Scientific comparative verdict code"
    )
    verdict_explanation: str = Field(..., description="Detailed explanation of empirical comparison results")

