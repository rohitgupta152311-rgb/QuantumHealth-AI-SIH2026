import axios from 'axios';
import type {
  HealthResponse,
  DiseaseInfo,
  PredictionRequest,
  PredictionResponse,
  ModelComparisonResponse,
  QuantumCircuitInfo,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  // Training includes 5-fold quantum cross-validation and needs more time
  // than a normal prediction request.
  timeout: 300000,
});

export const healthCheck = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>('/health');
  return data;
};

export const getDiseases = async (): Promise<DiseaseInfo[]> => {
  const { data } = await api.get<{ diseases: DiseaseInfo[] }>('/diseases');
  return data.diseases;
};

export const getDisease = async (id: string): Promise<DiseaseInfo> => {
  const { data } = await api.get<DiseaseInfo>(`/diseases/${id}`);
  return data;
};

export const predict = async (request: PredictionRequest): Promise<PredictionResponse> => {
  const { data } = await api.post<any>('/predict', request);

  const classicalResults = (data.classical_results || []).map((result: any) => ({
    model: result.model_name || result.model || 'Classical Model',
    model_name: result.model_name || result.model,
    risk_probability: result.risk_probability,
    prediction: result.prediction === 'high_risk' || result.prediction === 1 ? 1 : 0,
    confidence: result.confidence ?? 0,
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
    method: 'Weighted Quantum-Classical Fusion (60/40)',
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
    risk_level: data.hybrid_result?.risk_level || 'moderate',
    classical_results: classicalResults,
    quantum_result: quantumResult,
    hybrid_result: hybridResult,
    consensus,
    feature_importance: data.feature_importance,
    quantum_readiness: quantumReadiness,
    processing_steps: data.processing_steps || [],
    disclaimer: data.disclaimer,
  };
};

export const getModelComparison = async (disease: string): Promise<ModelComparisonResponse> => {
  const { data: experiments } = await api.get<any[]>('/experiments/experiment-results');
  const experiment = experiments.find((item) => item.disease === disease && item.metrics?.metrics);
  if (!experiment) {
    throw new Error(`No saved training experiment was found for ${disease}. Train this model first.`);
  }

  const metrics = experiment.metrics.metrics;
  const models = [
    ['Classical Random Forest', 'classical'],
    ['Quantum VQC (simulator)', 'quantum'],
    ['Hybrid 60/40', 'hybrid'],
  ].map(([name, key]) => {
    const model = metrics[key] || {};
    return {
      name,
      accuracy: model.accuracy,
      precision: model.precision,
      recall: model.recall,
      f1: model.f1_score,
      auc: model.auc_roc,
      confusion_matrix: model.confusion_matrix,
    };
  });
  const topModel = models.reduce((best, model) =>
    model.accuracy > best.accuracy ? model : best
  );

  return {
    disease,
    models,
    winner: topModel.name,
    verdict: 'further_research_required',
    explanation: `Latest saved held-out evaluation (experiment #${experiment.id}). Review these results together with cross-validation before drawing any research conclusion; they are not clinical performance claims.`,
    confusion_matrix: metrics.hybrid?.confusion_matrix,
  };
};

export const getQuantumConfig = async (disease: string): Promise<QuantumCircuitInfo> => {
  const { data } = await api.get<any>(`/quantum/quantum-config?disease=${disease}`);
  return {
    disease: data.disease,
    qubits: data.n_qubits ?? data.qubits,
    n_qubits: data.n_qubits,
    gates: data.n_parameters,
    gates_used: data.gates_used,
    layers: data.n_layers ?? data.layers,
    n_layers: data.n_layers,
    circuit_depth: data.circuit_depth,
    parameters: data.n_parameters,
    n_parameters: data.n_parameters,
    encoding: data.encoding_method,
    encoding_method: data.encoding_method,
    entanglement: data.entanglement_method,
    entanglement_method: data.entanglement_method,
    backend: data.backend,
    circuit_ascii: data.circuit_ascii,
    feature_to_qubit_map: data.feature_to_qubit_map,
  };
};

export interface TrainModelsResponse {
  status: string;
  disease: string;
  experiment_id: number;
  model_version_id: number;
}

export const trainModels = async (disease: string): Promise<TrainModelsResponse> => {
  const { data } = await api.post<TrainModelsResponse>('/models/train', {
    disease,
    force_retrain: true,
  });
  return data;
};
