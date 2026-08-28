/**
 * QuantumHealth AI — Shared API Contracts
 * Both frontend and backend must conform to these interfaces.
 * Team Member 1 (Frontend) and Team Member 4 (Backend) both read this file.
 */

// ─── Request Types ─────────────────────────────────────────────────────────

export interface PredictionRequest {
  disease: "diabetes" | "heart" | "breast_cancer";
  features: Record<string, number>;
  mode: "hybrid" | "classical" | "quantum";
}

export interface UploadDatasetRequest {
  disease: "diabetes" | "heart" | "breast_cancer";
  file: File; // multipart/form-data
}

export interface ModelTrainRequest {
  disease: "diabetes" | "heart" | "breast_cancer";
  force_retrain?: boolean;
}

// ─── Response Types ─────────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok";
  version: string;
  quantum_backend: string;
}

export interface DiseaseInfo {
  id: "diabetes" | "heart" | "breast_cancer";
  name: string;
  description: string;
  features: FeatureInfo[];
  dataset_size: number;
  status: "ready" | "training" | "not_trained";
}

export interface FeatureInfo {
  name: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  description: string;
}

export interface ClassicalResult {
  model: string; // "RandomForest" | "SVM" | "LogisticRegression"
  risk_probability: number; // 0-1
  prediction: "high_risk" | "low_risk";
  confidence: number; // 0-1
}

export interface QuantumResult {
  backend: string; // "pennylane:default.qubit"
  qubits_used: number;
  circuit_depth: number;
  encoding: string; // "AngleEncoding"
  risk_probability: number; // 0-1
  prediction: "high_risk" | "low_risk";
  simulation_mode: true; // always true for MVP
  execution_time_ms: number;
}

export interface HybridResult {
  risk_probability: number; // 0-1
  risk_percentage: number; // 0-100
  prediction: "high_risk" | "low_risk";
  confidence: number; // 0-1
  risk_level: "low" | "moderate" | "high" | "very_high";
}

export interface ConsensusResult {
  agreement: "strong_agreement" | "moderate_agreement" | "disagreement";
  recommendation:
    | "consistent_prediction"
    | "further_investigation_recommended"
    | "clinical_review_advised";
  classical_votes: Record<string, "high_risk" | "low_risk">;
  quantum_vote: "high_risk" | "low_risk";
  final_vote: "high_risk" | "low_risk";
  disagreement_detected: boolean;
}

export interface FeatureImportance {
  feature: string;
  label: string;
  importance: number; // 0-1
  rank: number;
}

export interface QuantumReadiness {
  original_features: number;
  selected_features: number;
  qubits_required: number;
  dimensionality_reduction_ratio: number; // e.g. 0.8 = 80%
  encoding_method: string;
  circuit_depth: number;
  layers: number;
  backend: string;
  simulation_status: "simulated";
  feature_to_qubit_map: Record<string, number>;
}

export interface PredictionResponse {
  disease: string;
  classical_results: ClassicalResult[];
  quantum_result: QuantumResult;
  hybrid_result: HybridResult;
  consensus: ConsensusResult;
  feature_importance: FeatureImportance[];
  quantum_readiness: QuantumReadiness;
  processing_steps: ProcessingStep[];
  disclaimer: string;
}

export interface ProcessingStep {
  step: number;
  name: string;
  status: "completed" | "in_progress" | "pending";
  detail?: string;
}

export interface ModelMetrics {
  model_name: string;
  model_type: "classical" | "quantum" | "hybrid";
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  training_time_s: number;
  inference_time_ms: number;
  confusion_matrix: number[][]; // [[TN,FP],[FN,TP]]
}

export interface ModelComparisonResponse {
  disease: string;
  models: ModelMetrics[];
  winner: string;
  verdict:
    | "hybrid_better"
    | "classical_better"
    | "similar_performance"
    | "further_research_required";
  verdict_explanation: string;
}

export interface QuantumCircuitInfo {
  disease: string;
  n_qubits: number;
  n_layers: number;
  circuit_depth: number;
  n_parameters: number;
  gates_used: string[];
  entanglement_method: string;
  encoding_method: string;
  backend: string;
  circuit_ascii?: string;
  feature_to_qubit_map: Record<string, number>;
}
