from typing import Literal, Optional, Dict, List, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.disease import DiseaseID

class PredictionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "disease": "diabetes",
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
    disease: DiseaseID = Field(..., description="Target disease module ID ('diabetes', 'heart', 'breast_cancer')")
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
    model_config = ConfigDict(protected_namespaces=())
    model_name: str = Field(..., description="Name of the classical model (e.g. 'RandomForest', 'SVM', 'LogisticRegression')")
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Risk probability score in [0.0, 1.0]")
    prediction: Literal["high_risk", "low_risk"] = Field(..., description="Binary classification output")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model decision confidence metric in [0.0, 1.0]")

class QuantumResult(BaseModel):
    backend: str = Field(..., description="Quantum simulator backend identifier")
    qubits_used: int = Field(..., ge=1, le=32, description="Number of qubits allocated for angle encoding")
    circuit_depth: int = Field(..., ge=1, description="Depth of the variational quantum circuit")
    encoding: str = Field(..., description="Quantum feature encoding scheme (e.g. 'Angle Encoding')")
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Quantum expectation value mapped to [0.0, 1.0]")
    prediction: Literal["high_risk", "low_risk"] = Field(..., description="Quantum classification output")
    simulation_mode: bool = Field(True, description="Strict indicator that execution is on a quantum simulator")
    execution_time_ms: float = Field(..., ge=0.0, description="Circuit execution latency in milliseconds")

class HybridResult(BaseModel):
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Synthesized hybrid risk probability in [0.0, 1.0]")
    risk_percentage: float = Field(..., ge=0.0, le=100.0, description="Human-readable risk percentage in [0.0, 100.0]")
    prediction: Literal["high_risk", "low_risk"] = Field(..., description="Final hybrid diagnostic decision")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Decision confidence score in [0.0, 1.0]")
    risk_level: Literal["low", "moderate", "high", "very_high"] = Field(..., description="Stratified clinical risk band")

class ConsensusResult(BaseModel):
    agreement: Literal["strong_agreement", "moderate_agreement", "disagreement"] = Field(
        ..., description="3-tier consensus agreement classification"
    )
    recommendation: str = Field(..., description="Clinical action recommendation code")
    classical_votes: Dict[str, Literal["high_risk", "low_risk"]] = Field(..., description="Individual classical model votes")
    quantum_vote: Literal["high_risk", "low_risk"] = Field(..., description="Quantum VQC vote")
    final_vote: Literal["high_risk", "low_risk"] = Field(..., description="Weighted consensus outcome")
    disagreement_detected: bool = Field(..., description="True if quantum and classical models diverge")

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
    disease: str = Field(..., description="Target disease module evaluated")
    classical_results: List[ClassicalResult] = Field(..., description="Individual classical model results")
    quantum_result: QuantumResult = Field(..., description="Quantum VQC result")
    hybrid_result: HybridResult = Field(..., description="Synthesized hybrid result")
    consensus: ConsensusResult = Field(..., description="Multi-model consensus assessment")
    feature_importance: List[FeatureImportance] = Field(..., description="Ranked feature attribution report")
    quantum_readiness: QuantumReadiness = Field(..., description="Quantum circuit hardware readiness specs")
    processing_steps: List[ProcessingStep] = Field(..., description="Diagnostic execution trace")
    disclaimer: str = Field(
        "This platform is an experimental AI-assisted research and decision-support "
        "system and is not a replacement for professional medical diagnosis.",
        description="Clinical and ethical disclaimer"
    )
