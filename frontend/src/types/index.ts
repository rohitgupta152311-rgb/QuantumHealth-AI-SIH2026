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
  model_input_range?: [number, number];
  missing_sentinels?: number[];
  required?: boolean;
  unit?: string | null;
  description?: string;
}

export interface PresetInfo {
  is_synthetic?: boolean;
  demo_label: string;
  description: string;
  data: Record<string, number>;
}

export interface DiseaseInfo {
  id: string;
  name: string;
  description: string;
  features: FeatureInfo[];
  dataset_size?: number;
  source?: string;
  source_citation?: string;
  source_url?: string;
  dataset_license?: string;
  is_synthetic_demonstration?: boolean;
  evaluation_protocol?: string;
  presets?: Record<string, PresetInfo>;
  source_rows?: number;
  unaugmented_test_rows?: number;
  status?: string;
}

export interface PredictionRequest {
  disease: string;
  schema_version?: string;
  features: Record<string, number>;
  mode?: 'classical' | 'quantum' | 'hybrid';
}

export interface ClassicalResult {
  model_name?: string;
  model?: string;
  risk_probability: number;
  prediction: number | string;
  confidence: number;
  is_calibrated?: boolean;
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
  agreement_level?: 'high' | 'medium' | 'low' | 'strong_agreement' | 'moderate_agreement' | 'disagreement';
  recommendation?: string;
  clinical_review_advised?: boolean;
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
  qubits?: number;
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

export interface LocalDriver {
  feature: string;
  label?: string;
  unit?: string;
  input_value: number;
  effect_on_model_score: string;
  contribution: number;
}

export interface PredictionResponse {
  disease: string;
  status?: 'completed' | 'abstained';
  abstention_reason?: string;
  disagreement_range?: {
    lower: number;
    upper: number;
    spread: number;
    label: string;
  };
  explanations?: {
    classical?: {
      explanation_method: string;
      top_drivers: LocalDriver[];
    };
    quantum?: {
      explanation_method: string;
      qubit_mapping: string[];
    };
    scope?: string;
  };
  model_manifest_hash?: string;
  risk_level?: 'low' | 'moderate' | 'high' | 'very_high';
  classical_results?: ClassicalResult[];
  quantum_result?: QuantumResult;
  hybrid_result?: HybridResult;
  consensus?: ConsensusResult;
  feature_importance?: FeatureImportance[];
  quantum_readiness?: QuantumReadiness;
  processing_steps?: ProcessingStep[];
  disclaimer?: string;
}

export interface ModelMetrics {
  model_name: string;
  name?: string;
  model_type?: string;
  accuracy: number;
  precision: number;
  recall: number;
  sensitivity?: number;
  specificity?: number;
  f1_score: number;
  f1?: number;
  roc_auc: number;
  auc?: number;
  pr_auc?: number;
  brier_score?: number;
  is_calibrated?: boolean;
  calibration_curve?: { predicted: number; observed: number }[];
  training_time_s?: number;
  training_time?: number;
  inference_time_ms?: number;
  inference_time?: number;
  confusion_matrix?: number[][];
}

export interface ModelComparisonResponse {
  disease: string;
  models: ModelMetrics[];
  winner?: string;
  verdict: 'hybrid_better' | 'classical_better' | 'similar' | 'similar_performance' | 'further_research' | 'further_research_required';
  explanation?: string;
  verdict_explanation?: string;
  confusion_matrix?: number[][];
}

export interface QuantumCircuitInfo {
  disease?: string;
  n_qubits: number;
  qubits?: number;
  n_gates?: number;
  gates?: number;
  gates_used?: string[];
  n_layers: number;
  layers?: number;
  circuit_depth?: number;
  n_parameters: number;
  parameters?: number;
  encoding_method: string;
  encoding?: string;
  entanglement_method: string;
  entanglement?: string;
  backend: string;
  circuit_ascii?: string;
  feature_to_qubit_map?: Record<string, number>;
}

export interface SimulatorBenchmarkResult {
  name: string;
  identifier: string;
  type: string;
  available: boolean;
  status: string;
  latency_ms_per_eval: number;
  throughput_evals_per_sec: number;
  speedup_factor_vs_reference: number;
  expectation_value: number;
  deviation_from_exact: number;
  hardware_ecosystem: string;
  capabilities: string[];
}

export interface QuantumBenchmarkResponse {
  n_qubits: number;
  n_layers: number;
  circuit_depth: number;
  n_parameters: number;
  evaluations_per_backend: number;
  optimal_fastest_simulator: string;
  optimal_nisq_target_simulator: string;
  max_statevector_fidelity_deviation: number;
  benchmarks: SimulatorBenchmarkResult[];
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

export interface TrainingProgress {
  stage: string;
  model_name?: string;
  progress: number;
  message: string;
  elapsed_seconds?: number;
}

export interface BatchPatientItem {
  patient_id?: string;
  features: Record<string, number>;
}

export interface BatchPredictionRequest {
  disease: string;
  patients: BatchPatientItem[];
  mode?: 'hybrid' | 'classical' | 'quantum';
  apply_icmr_calibration?: boolean;
}

export interface BatchPatientResult {
  patient_id: string;
  status: 'completed' | 'abstained';
  risk_level?: 'low' | 'moderate' | 'high' | 'very_high' | null;
  triage_priority: 'urgent_followup' | 'moderate_monitoring' | 'routine_screening' | 'data_quality_alert';
  risk_probability?: number | null;
  risk_percentage?: number | null;
  abstention_reason?: string | null;
  top_driver?: string | null;
  consensus_agreement?: string | null;
}

export interface BatchPredictionResponse {
  disease: string;
  total_screened: number;
  summary: {
    urgent_followup: number;
    moderate_monitoring: number;
    routine_screening: number;
    data_quality_alert: number;
  };
  patients: BatchPatientResult[];
  model_manifest_hash?: string;
  population_note?: string;
}

export interface QuantumNoiseSimulationRequest {
  n_qubits: number;
  n_layers: number;
  depolarizing_error_rate: number;
  readout_error_rate: number;
}

export interface QuantumNoiseSimulationResponse {
  n_qubits: number;
  n_layers: number;
  circuit_depth: number;
  total_gate_count: number;
  ideal_state_fidelity: number;
  noisy_state_fidelity: number;
  fidelity_retention_pct: number;
  ideal_expectation: number;
  noisy_expectation: number;
  ideal_risk_probability: number;
  noisy_risk_probability: number;
  expectation_shift: number;
  quantum_parameter_count: number;
  classical_rf_node_count: number;
  parameter_compression_ratio: number;
  hilbert_space_dimension: number;
  nisq_stability_verdict: string;
  noise_curve: Array<{
    error_rate: number;
    fidelity: number;
    risk_probability: number;
  }>;
}

export interface ClinicalGuideline {
  guideline_body: string;
  guideline_name: string;
  year: number;
  recommendation_tier: string;
  clinical_thresholds: Record<string, string>;
  south_asian_relevance?: string;
  citation_url: string;
}

export interface BiomarkerEvidenceResponse {
  biomarker: string;
  disease: string;
  normal_physiological_range: string;
  warning_threshold: string;
  critical_threshold: string;
  clinical_interpretation: string;
  guidelines: ClinicalGuideline[];
  recommended_clinical_actions: string[];
  disclaimer: string;
}

export interface ChatMessageItem {
  role: 'user' | 'model' | 'assistant';
  text: string;
  timestamp?: string;
  source?: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessageItem[];
  patient_context?: Record<string, any> | null;
  api_key?: string | null;
}

export interface ChatResponse {
  reply: string;
  source: string;
  references: string[];
  suggested_followups: string[];
}

