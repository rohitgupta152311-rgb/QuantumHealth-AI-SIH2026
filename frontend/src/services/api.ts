import axios from 'axios';
import type {
  HealthResponse,
  DiseaseInfo,
  PredictionRequest,
  PredictionResponse,
  ModelComparisonResponse,
  QuantumCircuitInfo,
  QuantumBenchmarkResponse,
  BatchPredictionRequest,
  BatchPredictionResponse,
  QuantumNoiseSimulationRequest,
  QuantumNoiseSimulationResponse,
  BiomarkerEvidenceResponse,
  ChatRequest,
  ChatResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
});

const FALLBACK_DISEASES: DiseaseInfo[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config._retryCount) config._retryCount = 0;
    if (config._retryCount < 2 && error.code === 'ECONNABORTED') {
      config._retryCount++;
      await new Promise(r => setTimeout(r, 1000 * config._retryCount));
      return api(config);
    }
    return Promise.reject(error);
  }
);

export const healthCheck = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>('/health');
  return data;
};

export const getDiseases = async (): Promise<DiseaseInfo[]> => {
  try {
    const { data } = await api.get<{ diseases: DiseaseInfo[] }>('/diseases');
    if (data && Array.isArray(data.diseases) && data.diseases.length > 0) {
      return data.diseases;
    }
  } catch (err) {
    console.error('Backend diseases endpoint unavailable:', err);
  }
  return FALLBACK_DISEASES;
};

export const getDisease = async (id: string): Promise<DiseaseInfo> => {
  try {
    const { data } = await api.get<DiseaseInfo>(`/diseases/${id}`);
    if (data && data.features) return data;
  } catch (err) {
    console.warn(`Backend disease detail for ${id} unavailable, using documented schema:`, err);
  }
  return FALLBACK_DISEASES.find(d => d.id === id) || FALLBACK_DISEASES[0];
};

export const predict = async (request: PredictionRequest): Promise<PredictionResponse> => {
  const { data } = await api.post<any>('/predict', request);

  // If backend returned abstention, pass through directly
  if (data.status === 'abstained') {
    return {
      disease: data.disease,
      status: 'abstained',
      abstention_reason: data.abstention_reason,
      disagreement_range: data.disagreement_range,
      model_manifest_hash: data.model_manifest_hash,
      disclaimer: data.disclaimer,
      classical_results: [],
      processing_steps: data.processing_steps || [],
      risk_level: 'moderate',
    };
  }

  const classicalResults = (data.classical_results || []).map((result: any) => ({
    model: result.model_name || result.model || 'Classical Model',
    model_name: result.model_name || result.model,
    risk_probability: result.risk_probability,
    prediction: result.prediction === 'high_risk' || result.prediction === 1 ? 1 : 0,
    confidence: result.confidence ?? 0,
    is_calibrated: result.is_calibrated ?? true,
  }));

  const quantumResult = data.quantum_result ? {
    backend: data.quantum_result.backend,
    risk_probability: data.quantum_result.risk_probability,
    prediction: data.quantum_result.prediction === 'high_risk' || data.quantum_result.prediction === 1 ? 1 : 0,
    confidence: data.quantum_result.confidence ?? Math.abs(data.quantum_result.risk_probability - 0.5) * 2,
    circuit_depth: data.quantum_result.circuit_depth,
    qubits_used: data.quantum_result.qubits_used,
    encoding: data.quantum_result.encoding,
    simulation_mode: data.quantum_result.simulation_mode,
    execution_time_ms: data.quantum_result.execution_time_ms,
  } : undefined;

  const hybridResult = data.hybrid_result ? {
    risk_probability: data.hybrid_result.risk_probability,
    risk_percentage: data.hybrid_result.risk_percentage,
    prediction: data.hybrid_result.prediction === 'high_risk' || data.hybrid_result.prediction === 1 ? 1 : 0,
    confidence: data.hybrid_result.confidence,
    risk_level: data.hybrid_result.risk_level,
    method: 'Configurable Hybrid Fusion (Default 60/40)',
  } : undefined;

  const consensus = data.consensus ? {
    agreement: data.consensus.agreement,
    agreement_level: (
      data.consensus.agreement === 'strong_agreement'
        ? 'high'
        : data.consensus.agreement === 'moderate_agreement'
          ? 'medium'
          : 'low'
    ) as 'high' | 'medium' | 'low',
    clinical_review_advised: data.consensus.disagreement_detected || data.consensus.agreement === 'disagreement',
    classical_votes: typeof data.consensus.classical_votes === 'object'
      ? Object.values(data.consensus.classical_votes).filter((value: any) => value === 'high_risk' || value === 1).length
      : Number(data.consensus.classical_votes || 0),
    quantum_votes: data.quantum_result?.prediction === 'high_risk' || data.quantum_result?.prediction === 1 ? 1 : 0,
    quantum_vote: data.consensus.quantum_vote,
    final_vote: data.consensus.final_vote === 'high_risk' || data.consensus.final_vote === 1 ? 1 : 0,
    recommendation: data.consensus.recommendation,
    disagreement_detected: data.consensus.disagreement_detected,
  } : undefined;

  const quantumReadiness = data.quantum_readiness ? {
    original_features: data.quantum_readiness.original_features,
    selected_features: data.quantum_readiness.selected_features,
    qubits: data.quantum_readiness.qubits_required || data.quantum_readiness.selected_features,
    qubits_required: data.quantum_readiness.qubits_required,
    reduction_ratio: data.quantum_readiness.dimensionality_reduction_ratio,
    dimensionality_reduction_ratio: data.quantum_readiness.dimensionality_reduction_ratio,
    encoding_method: data.quantum_readiness.encoding_method,
    circuit_depth: data.quantum_readiness.circuit_depth,
    layers: data.quantum_readiness.layers,
    backend: data.quantum_readiness.backend,
    simulation_status: data.quantum_readiness.simulation_status,
    feature_to_qubit_map: data.quantum_readiness.feature_to_qubit_map,
  } : undefined;

  return {
    disease: data.disease,
    status: data.status || 'completed',
    abstention_reason: data.abstention_reason,
    disagreement_range: data.disagreement_range,
    explanations: data.explanations,
    model_manifest_hash: data.model_manifest_hash,
    risk_level: data.hybrid_result?.risk_level || 'moderate',
    classical_results: classicalResults,
    quantum_result: quantumResult,
    hybrid_result: hybridResult,
    consensus,
    feature_importance: data.feature_importance || [],
    quantum_readiness: quantumReadiness,
    processing_steps: data.processing_steps || [],
    disclaimer: data.disclaimer,
  };
};

export const getModelComparison = async (diseaseId: string): Promise<ModelComparisonResponse> => {
  const { data } = await api.get<any>(`/models/compare?disease=${diseaseId}`);
  return {
    disease: data.disease,
    models: (data.models || []).map((m: any) => ({
      model_name: m.model_name || m.name,
      name: m.model_name || m.name,
      model_type: m.model_type || 'classical',
      accuracy: m.accuracy,
      precision: m.precision,
      recall: m.recall,
      sensitivity: m.sensitivity ?? m.recall,
      specificity: m.specificity ?? 0.0,
      f1_score: m.f1_score ?? m.f1,
      f1: m.f1_score ?? m.f1,
      roc_auc: m.roc_auc ?? m.auc,
      auc: m.roc_auc ?? m.auc,
      pr_auc: m.pr_auc,
      brier_score: m.brier_score,
      is_calibrated: m.is_calibrated,
      calibration_curve: m.calibration_curve,
      training_time_s: m.training_time_s ?? m.training_time,
      training_time: m.training_time_s ?? m.training_time,
      inference_time_ms: m.inference_time_ms ?? m.inference_time,
      inference_time: m.inference_time_ms ?? m.inference_time,
      confusion_matrix: m.confusion_matrix,
    })),
    winner: data.winner,
    verdict: data.verdict,
    verdict_explanation: data.verdict_explanation,
    explanation: data.verdict_explanation || '',
    confusion_matrix: data.confusion_matrix,
  };
};

export const getQuantumCircuit = async (diseaseId: string): Promise<QuantumCircuitInfo> => {
  const { data } = await api.get<any>(`/quantum/circuit?disease=${diseaseId}`);
  return {
    disease: data.disease,
    n_qubits: data.n_qubits || data.qubits,
    qubits: data.n_qubits || data.qubits,
    n_gates: data.n_gates || data.gates || data.circuit_depth,
    gates: data.n_gates || data.gates || data.circuit_depth,
    gates_used: data.gates_used,
    n_layers: data.n_layers || data.layers,
    layers: data.n_layers || data.layers,
    circuit_depth: data.circuit_depth,
    n_parameters: data.n_parameters || data.parameters,
    parameters: data.n_parameters || data.parameters,
    encoding_method: data.encoding_method || data.encoding,
    encoding: data.encoding_method || data.encoding,
    entanglement_method: data.entanglement_method || data.entanglement,
    entanglement: data.entanglement_method || data.entanglement,
    backend: data.backend,
    circuit_ascii: data.circuit_ascii,
    feature_to_qubit_map: data.feature_to_qubit_map,
  };
};

export const trainModels = async (diseaseId: string): Promise<any> => {
  const { data } = await api.post(`/models/train?disease=${diseaseId}`);
  return data;
};

export const getQuantumConfig = getQuantumCircuit;

export const runQuantumBenchmark = async (
  nQubits: number = 6,
  nLayers: number = 2,
  evaluations: number = 10
): Promise<QuantumBenchmarkResponse> => {
  const { data } = await api.post<QuantumBenchmarkResponse>('/quantum/benchmark', {
    n_qubits: nQubits,
    n_layers: nLayers,
    evaluations_per_backend: evaluations,
  });
  return data;
};

export const getAvailableQuantumBackends = async (): Promise<{
  active_backend: string;
  available_backends: Array<{
    name: string;
    identifier: string;
    type: string;
    acceleration?: string;
    speedup?: string;
    hardware_targets?: string[];
    openqasm_export?: boolean;
    status: string;
  }>;
  qsvm_available: boolean;
  vqc_available: boolean;
}> => {
  const { data } = await api.get('/quantum/backends');
  return data;
};

export const simulateQuantumCircuit = async (
  disease: string = 'diabetes',
  backend: string = 'pennylane:lightning.qubit',
  features?: Record<string, number>
): Promise<{
  disease: string;
  backend: string;
  n_qubits: number;
  circuit_depth: number;
  expectation_value: number;
  born_probability: number;
  execution_time_ms: number;
  selected_features: string[];
  circuit_ascii: string;
}> => {
  const { data } = await api.post('/quantum/simulate', {
    disease,
    backend,
    features,
  });
  return data;
};

export const predictBatch = async (
  request: BatchPredictionRequest
): Promise<BatchPredictionResponse> => {
  const { data } = await api.post<BatchPredictionResponse>('/predict/batch', request);
  return data;
};

export const simulateQuantumNoise = async (
  request: QuantumNoiseSimulationRequest
): Promise<QuantumNoiseSimulationResponse> => {
  const { data } = await api.post<QuantumNoiseSimulationResponse>('/quantum/noise-simulation', request);
  return data;
};

export const getClinicalEvidence = async (
  biomarker: string,
  disease: string = 'diabetes'
): Promise<BiomarkerEvidenceResponse> => {
  const { data } = await api.get<BiomarkerEvidenceResponse>(
    `/clinical-evidence?biomarker=${encodeURIComponent(biomarker)}&disease=${encodeURIComponent(disease)}`
  );
  return data;
};

export const sendChatMessage = async (
  request: ChatRequest
): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>('/chat', request);
  return data;
};

export default api;

