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
TrainModelsResponse,
DatasetUploadResponse,
ModelMetrics,
TestSplitInsights,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
});

const FALLBACK_DISEASES: DiseaseInfo[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);
    if (!config._retryCount) config._retryCount = 0;
    // Retrying a timed-out POST could repeat uploads or expensive training.
    if (config.method === 'get' && config._retryCount < 2 && error.code === 'ECONNABORTED') {
      config._retryCount++;
      await new Promise(r => setTimeout(r, 1000 * config._retryCount));
      return api(config);
    }
    return Promise.reject(error);
  }
);

export const healthCheck = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>('/health', { timeout: 5000 });
  return data;
};

export const getDiseases = async (): Promise<DiseaseInfo[]> => {
  const { data } = await api.get<{ diseases: DiseaseInfo[] }>('/diseases', { timeout: 10000 });
  if (!data || !Array.isArray(data.diseases)) {
    throw new Error('The backend returned an invalid disease registry response.');
  }
  return data.diseases;
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

/**
 * Generates an explicit mock demonstration prediction for offline UI demonstration only.
 * Visibly flagged with is_mock: true and is_demo: true so mock data is never confused with live results.
 */
export const getDemoMockPrediction = (disease: string = 'heart'): PredictionResponse => {
  return {
    disease,
    status: 'completed',
    is_mock: true,
    is_demo: true,
    risk_level: 'moderate',
    model_manifest_hash: 'mock-demo-synthetic-preview',
    classical_results: [
      { model_name: 'RandomForest (Mock)', risk_probability: 0.38, prediction: 0, confidence: 0.24, is_calibrated: false },
      { model_name: 'SVM (Mock)', risk_probability: 0.22, prediction: 0, confidence: 0.56, is_calibrated: false },
      { model_name: 'LogisticRegression (Mock)', risk_probability: 0.31, prediction: 0, confidence: 0.38, is_calibrated: false },
      { model_name: 'GradientBoosting (Mock)', risk_probability: 0.55, prediction: 1, confidence: 0.10, is_calibrated: false },
    ],
    quantum_result: {
      backend: 'mock:client_demo (Synthetic Preview)',
      risk_probability: 0.46,
      prediction: 0,
      confidence: 0.08,
      circuit_depth: 17,
      qubits_used: 6,
      encoding: 'Angle RY(pi * x_i)',
      simulation_mode: true,
      execution_time_ms: 1.5,
    },
    hybrid_result: {
      risk_probability: 0.39,
      risk_percentage: 39.0,
      prediction: 0,
      confidence: 0.22,
      risk_level: 'moderate',
      method: '60/40 Classical-Quantum Consensus (Mock Demonstration)',
    },
    consensus: {
      agreement: 'moderate_agreement',
      agreement_level: 'medium',
      classical_votes: 1,
      quantum_votes: 0,
      quantum_vote: 'low_risk',
      final_vote: 0,
      clinical_review_advised: true,
      recommendation: 'clinical_review_advised',
      disagreement_detected: false,
    },
    feature_importance: [
      { feature: 'thal', label: 'Thallium Stress Scintigraphy', importance: 0.19, rank: 1 },
      { feature: 'thalach', label: 'Max Heart Rate', importance: 0.12, rank: 2 },
      { feature: 'cp', label: 'Chest Pain Type', importance: 0.10, rank: 3 },
      { feature: 'age', label: 'Patient Age', importance: 0.09, rank: 4 },
    ],
    quantum_readiness: {
      original_features: 13,
      selected_features: 6,
      qubits_required: 6,
      dimensionality_reduction_ratio: 0.46,
      encoding_method: 'Angle Encoding RY(pi * x_i)',
      circuit_depth: 17,
      layers: 2,
      backend: 'pennylane:default.qubit',
      simulation_status: 'Simulated (Mock Preview)',
    },
    processing_steps: [
      { step: 1, name: 'Biomarker Sentinel Check (Mock Demo)', status: 'completed' },
      { step: 2, name: 'Classical Ensemble Inference (Mock Demo)', status: 'completed' },
      { step: 3, name: '6-Qubit VQC Simulation (Mock Demo)', status: 'completed' },
      { step: 4, name: 'Hybrid Consensus Stratification (Mock Demo)', status: 'completed' },
    ],
    disclaimer: 'DEMO MODE — MOCK DATA: Generated for demonstration purposes only. Not evaluated by the live backend pipeline.',
  };
};

export const predict = async (request: PredictionRequest): Promise<PredictionResponse> => {
  const { data } = await api.post<any>('/predict', request, { timeout: 30000 });

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
    method: data.hybrid_result.blend_ratio_label || 'Hybrid Consensus',
    quantum_weight: data.hybrid_result.quantum_weight,
    classical_weight: data.hybrid_result.classical_weight,
    blend_ratio_label: data.hybrid_result.blend_ratio_label,
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

export const uploadDataset = async (file: File, disease: string): Promise<DatasetUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('disease', disease);

  const { data } = await api.post<DatasetUploadResponse>('/datasets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getModelComparison = async (diseaseId: string): Promise<ModelComparisonResponse> => {
  try {
    const { data } = await api.get<any>(`/models/compare?disease=${diseaseId}`);
    const models: ModelMetrics[] = (data.models || []).map((m: any) => ({
      model_name: m.model_name || m.name,
      name: m.model_name || m.name,
      model_type: m.model_type || 'classical',
      accuracy: typeof m.accuracy === 'number' ? m.accuracy : undefined,
      precision: typeof m.precision === 'number' ? m.precision : undefined,
      recall: typeof m.recall === 'number' ? m.recall : undefined,
      sensitivity: typeof m.sensitivity === 'number' ? m.sensitivity : (typeof m.recall === 'number' ? m.recall : undefined),
      specificity: typeof m.specificity === 'number' ? m.specificity : undefined,
      f1_score: typeof m.f1_score === 'number' ? m.f1_score : (typeof m.f1 === 'number' ? m.f1 : undefined),
      f1: typeof m.f1_score === 'number' ? m.f1_score : (typeof m.f1 === 'number' ? m.f1 : undefined),
      roc_auc: typeof m.roc_auc === 'number' ? m.roc_auc : (typeof m.auc === 'number' ? m.auc : undefined),
      auc: typeof m.roc_auc === 'number' ? m.roc_auc : (typeof m.auc === 'number' ? m.auc : undefined),
      pr_auc: typeof m.pr_auc === 'number' ? m.pr_auc : undefined,
      brier_score: typeof m.brier_score === 'number' ? m.brier_score : undefined,
      is_calibrated: m.is_calibrated,
      calibration_curve: m.calibration_curve,
      training_time_s: m.training_time_s ?? m.training_time,
      training_time: m.training_time_s ?? m.training_time,
      inference_time_ms: m.inference_time_ms ?? m.inference_time,
      inference_time: m.inference_time_ms ?? m.inference_time,
      confusion_matrix: m.confusion_matrix,
    }));

    const validModels = models.filter((m) => typeof m.accuracy === 'number');
    const topModel = validModels.length > 0
      ? validModels.reduce((best, m) => (m.accuracy! > best.accuracy! ? m : best))
      : undefined;
    const computedWinner = data.winner || topModel?.name || topModel?.model_name;

    return {
      disease: data.disease || diseaseId,
      models,
      winner: computedWinner,
      verdict: data.verdict || (topModel?.model_type === 'hybrid' ? 'hybrid_superior' : 'classical_superior'),
      verdict_explanation: data.verdict_explanation,
      explanation: data.verdict_explanation || data.explanation || '',
      confusion_matrix: data.confusion_matrix,
      provenance: data.provenance || {
        source: 'saved_checkpoint',
        experiment_id: data.experiment_id || `${diseaseId}-checkpoint`,
      },
    };
  } catch (primaryErr) {
    try {
      const { data: experiments } = await api.get<any[]>('/experiments/experiment-results');
      const experiment = experiments.find((item) => item.disease === diseaseId && item.metrics?.metrics);
      if (experiment) {
        const metrics = experiment.metrics.metrics;
        const models: ModelMetrics[] = [
          ['Classical Random Forest', 'classical'],
          ['Quantum VQC (simulator)', 'quantum'],
          ['Hybrid Ensemble', 'hybrid'],
        ].map(([name, key]) => {
          const model = metrics[key] || {};
          return {
            model_name: name,
            name,
            model_type: key,
            accuracy: typeof model.accuracy === 'number' ? model.accuracy : undefined,
            precision: typeof model.precision === 'number' ? model.precision : undefined,
            recall: typeof model.recall === 'number' ? model.recall : undefined,
            f1_score: typeof model.f1_score === 'number' ? model.f1_score : (typeof model.f1 === 'number' ? model.f1 : undefined),
            f1: typeof model.f1_score === 'number' ? model.f1_score : (typeof model.f1 === 'number' ? model.f1 : undefined),
            roc_auc: typeof model.auc_roc === 'number' ? model.auc_roc : (typeof model.auc === 'number' ? model.auc : undefined),
            auc: typeof model.auc_roc === 'number' ? model.auc_roc : (typeof model.auc === 'number' ? model.auc : undefined),
            confusion_matrix: model.confusion_matrix,
          };
        });
        const validModels = models.filter((m) => typeof m.accuracy === 'number');
        const topModel = validModels.length > 0
          ? validModels.reduce((best, model) => model.accuracy! > best.accuracy! ? model : best)
          : undefined;
        return {
          disease: diseaseId,
          models,
          winner: topModel?.name,
          verdict: 'checkpoint_evaluation',
          explanation: `Saved evaluation checkpoint from experiment #${experiment.id} (${experiment.created_at || 'historical'}).`,
          verdict_explanation: `Saved evaluation checkpoint from experiment #${experiment.id}. Provenance: Checkpoint ID #${experiment.id}.`,
          provenance: {
            source: 'saved_checkpoint',
            experiment_id: experiment.id,
            timestamp: experiment.created_at,
          },
          confusion_matrix: metrics.hybrid?.confusion_matrix,
        };
      }
    } catch {
      // ignore fallback error
    }
    throw primaryErr;
  }
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

export const trainModels = async (diseaseId: string): Promise<TrainModelsResponse> => {
  const { data } = await api.post<TrainModelsResponse>('/models/train', {
    disease: diseaseId,
    force_retrain: true,
  });
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

export const getSplitInsights = async (
  diseaseId: string,
  testSize: number = 0.20
): Promise<TestSplitInsights> => {
  const { data } = await api.get<TestSplitInsights>(
    `/diseases/${encodeURIComponent(diseaseId)}/split-insights?test_size=${testSize}`
  );
  return data;
};

export const getQuantumBackends = async (): Promise<{
  active_backend: string;
  available_backends: Array<{
    name: string;
    identifier: string;
    type: string;
    description?: string;
    status: string;
  }>;
}> => {
  const { data } = await api.get<any>('/quantum/backends');
  return data;
};

export default api;

