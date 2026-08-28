export interface HealthResponse {
  status: string;
  version?: string;
  quantum_backend?: string;
}

export interface FeatureInfo {
  name: string;
  label?: string;
  type?: 'numeric' | 'categorical';
  min?: number;
  max?: number;
  min_val?: number;
  max_val?: number;
  unit?: string | null;
  description?: string;
}

export interface DiseaseInfo {
  id: string;
  name: string;
  description: string;
  features: FeatureInfo[];
  dataset_size?: number;
  status?: string;
}

export interface PredictionRequest {
  disease: string;
  features: Record<string, number>;
  mode?: 'classical' | 'quantum' | 'hybrid';
}

export interface ClassicalResult {
  model_name?: string;
  model: string;
  risk_probability: number;
  prediction: number | string;
  confidence: number;
}

export interface QuantumResult {
  backend?: string;
  risk_probability: number;
  prediction: number | string;
  confidence?: number;
  circuit_depth?: number;
  qubits_used?: number;
  encoding?: string;
  simulation_mode?: boolean;
  execution_time_ms?: number;
}

export interface HybridResult {
  risk_probability: number;
  risk_percentage?: number;
  prediction: number | string;
  confidence: number;
  risk_level?: 'low' | 'moderate' | 'high' | 'very_high';
  method?: string;
}

export interface ConsensusResult {
  agreement?: string;
  agreement_level: 'high' | 'medium' | 'low' | 'strong_agreement' | 'moderate_agreement' | 'disagreement';
  recommendation?: string;
  clinical_review_advised: boolean;
  classical_votes: number | Record<string, string>;
  quantum_votes?: number;
  quantum_vote?: string | number;
  final_vote: number | string;
  disagreement_detected?: boolean;
}

export interface FeatureImportance {
  feature: string;
  label?: string;
  importance: number;
  rank?: number;
}

export interface QuantumReadiness {
  original_features: number;
  selected_features: number;
  qubits: number;
  qubits_required?: number;
  reduction_ratio?: number;
  dimensionality_reduction_ratio?: number;
  encoding_method: string;
  circuit_depth: number;
  layers?: number;
  backend: string;
  simulation_status: string;
  feature_to_qubit_map?: Record<string, number>;
}

export interface ProcessingStep {
  step?: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
  message?: string;
}

export interface PredictionResponse {
  disease: string;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  classical_results: ClassicalResult[];
  quantum_result?: QuantumResult;
  hybrid_result?: HybridResult;
  consensus?: ConsensusResult;
  feature_importance?: FeatureImportance[];
  quantum_readiness?: QuantumReadiness;
  processing_steps: ProcessingStep[];
  disclaimer?: string;
}

export interface ModelMetrics {
  name: string;
  model_name?: string;
  model_type?: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  f1_score?: number;
  auc: number;
  roc_auc?: number;
  training_time?: number;
  training_time_s?: number;
  inference_time?: number;
  inference_time_ms?: number;
  confusion_matrix?: number[][];
}

export interface ModelComparisonResponse {
  disease: string;
  models: ModelMetrics[];
  winner?: string;
  verdict: 'hybrid_better' | 'classical_better' | 'similar' | 'similar_performance' | 'further_research' | 'further_research_required';
  explanation: string;
  verdict_explanation?: string;
  confusion_matrix?: number[][];
}

export interface QuantumCircuitInfo {
  disease?: string;
  qubits: number;
  n_qubits?: number;
  gates?: number;
  gates_used?: string[];
  layers: number;
  n_layers?: number;
  circuit_depth?: number;
  parameters: number;
  n_parameters?: number;
  encoding: string;
  encoding_method?: string;
  entanglement: string;
  entanglement_method?: string;
  backend: string;
  circuit_ascii?: string;
  feature_to_qubit_map?: Record<string, number>;
}

export interface AppState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
