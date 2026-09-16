from typing import Literal, Optional, Dict, List, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.disease import DiseaseID

class PredictionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "disease": "diabetes",
                "schema_version": "v1.0",
                "features": {
                    "Pregnancies": 6,
                    "Glucose": 148,
                    "BloodPressure": 72,
                    "SkinThickness": 35,
                    "Insulin": 169,
                    "BMI": 33.6,
                    "DiabetesPedigreeFunction": 0.627,
                    "Age": 50
                },
                "mode": "hybrid"
            }
        }
    )
    disease: DiseaseID = Field(..., description="Target disease module ID ('diabetes', 'heart', 'breast_cancer', 'kidney')")
    schema_version: Optional[str] = Field("v1.0", description="Schema version of client inputs")
    features: Dict[str, float] = Field(..., description="Dictionary of biomarker feature names and their numerical values")
    mode: Literal["hybrid", "classical", "quantum"] = Field("hybrid", description="Execution mode: 'hybrid' (default), 'classical', or 'quantum'")

    @field_validator("features")
    @classmethod
    def validate_features_not_empty(cls, v):
        if not v:
            raise ValueError("Features dictionary cannot be empty.")
        for k, val in v.items():
            if val is None or isinstance(val, (str, bool)) or (isinstance(val, float) and (val != val or val == float('inf') or val == float('-inf'))):
                raise ValueError(f"Feature '{k}' has an invalid numerical value: {val}")
        return v

class ClassicalResult(BaseModel):
    """Results from an individual classical machine learning model."""
    model_config = ConfigDict(protected_namespaces=(), populate_by_name=True)
    model_name: str = Field(..., description="Name of the classical model (e.g. 'RandomForest', 'SVM', 'LogisticRegression')")
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Calibrated risk probability score in [0.0, 1.0]")
    prediction: Literal["high_risk", "low_risk"] = Field(..., description="Binary classification output")
    confidence: Optional[float] = Field(None, description="Deprecated metric; prefer calibrated risk probability")
    is_calibrated: Optional[bool] = Field(True, description="Whether Platt scaling probability calibration was applied")

class QuantumResult(BaseModel):
    backend: str = Field(..., description="Quantum simulator backend identifier")
    qubits_used: int = Field(..., ge=1, le=32, description="Number of qubits allocated for angle encoding")
    circuit_depth: int = Field(..., ge=1, description="Depth of the variational quantum circuit")
    encoding: str = Field(..., description="Quantum feature encoding scheme (e.g. 'Angle Encoding')")
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Quantum Born measurement probability in [0.0, 1.0]")
    prediction: Literal["high_risk", "low_risk"] = Field(..., description="Quantum classification output")
    simulation_mode: bool = Field(True, description="Strict indicator that execution is on a quantum simulator")
    execution_time_ms: float = Field(..., ge=0.0, description="Circuit execution latency in milliseconds")
    is_calibrated: Optional[bool] = Field(False, description="Whether Platt calibration was applied")

class HybridResult(BaseModel):
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Synthesized hybrid risk probability in [0.0, 1.0]")
    risk_percentage: float = Field(..., ge=0.0, le=100.0, description="Human-readable risk percentage in [0.0, 100.0]")
    prediction: Literal["high_risk", "low_risk"] = Field(..., description="Final hybrid diagnostic decision")
    confidence: Optional[float] = Field(None, description="Deprecated metric; prefer calibrated probability + disagreement_range")
    disagreement_range: Optional[Dict[str, Any]] = Field(None, description="Internal model disagreement spread {lower, upper, spread, label}")
    risk_level: Literal["very_low", "low", "moderate", "high", "very_high"] = Field(..., description="Stratified clinical risk band")

class ConsensusResult(BaseModel):
    agreement: Literal["strong_agreement", "moderate_agreement", "disagreement"] = Field(
        ..., description="3-tier consensus agreement classification"
    )
    recommendation: str = Field(..., description="Clinical action recommendation code")
    classical_votes: Dict[str, Literal["high_risk", "low_risk"]] = Field(..., description="Individual classical model votes")
    quantum_vote: Literal["high_risk", "low_risk"] = Field(..., description="Quantum VQC vote")
    final_vote: Literal["high_risk", "low_risk"] = Field(..., description="Weighted consensus outcome")
    disagreement_detected: bool = Field(..., description="True if quantum and classical models diverge")
    disagreement_range: Optional[Dict[str, Any]] = Field(None, description="Internal model disagreement spread")

class FeatureImportance(BaseModel):
    feature: str = Field(..., description="Biomarker feature code")
    label: str = Field(..., description="Human-readable clinical label")
    importance: float = Field(..., ge=0.0, le=1.0, description="Normalized relative attribution score")
    rank: int = Field(..., ge=1, description="Ranking by importance")

class ProcessingStep(BaseModel):
    step: int
    name: str
    status: Literal["completed", "in_progress", "pending"] = "completed"
    detail: Optional[str] = None

class QuantumReadiness(BaseModel):
    original_features: int
    selected_features: int
    qubits_required: int
    dimensionality_reduction_ratio: float
    encoding_method: str
    circuit_depth: int
    layers: int
    backend: str
    simulation_status: str
    feature_to_qubit_map: Dict[str, int]

class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    disease: str = Field(..., description="Target disease module evaluated")
    status: Literal["completed", "abstained"] = Field("completed", description="Execution status: completed or abstained")
    abstention_reason: Optional[str] = Field(None, description="Detailed explanation if model abstained from prediction")
    disagreement_range: Optional[Dict[str, Any]] = Field(None, description="Internal model disagreement spread [min, max]")
    explanations: Optional[Dict[str, Any]] = Field(None, description="Separate classical and quantum local explanations")
    model_manifest_hash: Optional[str] = Field(None, description="SHA-256 hash of the reproducible training manifest")
    cohort: Optional[str] = Field(None, description="Clinical source cohort name and publication provenance")
    schema_version: Optional[str] = Field(None, description="Active biomarker schema version")
    prediction_horizon: Optional[str] = Field(None, description="Longitudinal observation or risk projection horizon")
    population_limitation: Optional[str] = Field(None, description="Clinical population scope and generalization boundaries")
    warnings: Optional[List[str]] = Field(default_factory=list, description="Clinical advisory and deprecation notices")
    classical_results: Optional[List[ClassicalResult]] = Field(None, description="Individual classical model results")
    quantum_result: Optional[QuantumResult] = Field(None, description="Quantum VQC result")
    hybrid_result: Optional[HybridResult] = Field(None, description="Synthesized hybrid result")
    consensus: Optional[ConsensusResult] = Field(None, description="Multi-model consensus assessment")
    feature_importance: Optional[List[FeatureImportance]] = Field(None, description="Ranked feature attribution report")
    quantum_readiness: Optional[QuantumReadiness] = Field(None, description="Quantum circuit hardware readiness specs")
    processing_steps: Optional[List[ProcessingStep]] = Field(None, description="Diagnostic execution trace")
    disclaimer: str = Field(
        "This platform is an experimental AI-assisted research and decision-support "
        "system and is not a replacement for professional medical diagnosis.",
        description="Clinical and ethical disclaimer"
    )

class BatchPatientItem(BaseModel):
    patient_id: Optional[str] = None
    features: Dict[str, float]

class BatchPredictionRequest(BaseModel):
    disease: DiseaseID
    patients: List[BatchPatientItem]
    mode: Literal["hybrid", "classical", "quantum"] = "hybrid"
    apply_icmr_calibration: Optional[bool] = False

class BatchPatientResult(BaseModel):
    patient_id: str
    status: Literal["completed", "abstained"]
    risk_level: Optional[str] = "low"
    triage_priority: Literal["urgent_followup", "moderate_monitoring", "routine_screening", "data_quality_alert"]
    risk_probability: Optional[float] = None
    risk_percentage: Optional[float] = None
    abstention_reason: Optional[str] = None
    top_driver: Optional[str] = None
    consensus_agreement: Optional[str] = None

class BatchPredictionResponse(BaseModel):
    disease: str
    total_screened: int
    summary: Dict[str, int]
    patients: List[BatchPatientResult]
    model_manifest_hash: Optional[str] = None
    population_note: Optional[str] = None
