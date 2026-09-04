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

const FALLBACK_DISEASES: DiseaseInfo[] = [
  {
    id: "diabetes",
    name: "Type 2 Diabetes",
    description: "Metabolic disease risk assessment using 253,680 patient records across 8 metabolic biomarkers (CDC BRFSS).",
    features: [
      { name: "Pregnancies", label: "Pregnancies", min_val: 0, max_val: 17, unit: null },
      { name: "Glucose", label: "Glucose Level", min_val: 44, max_val: 250, unit: "mg/dL" },
      { name: "BloodPressure", label: "Blood Pressure", min_val: 30, max_val: 130, unit: "mm Hg" },
      { name: "SkinThickness", label: "Skin Thickness", min_val: 0, max_val: 99, unit: "mm" },
      { name: "Insulin", label: "Insulin", min_val: 0, max_val: 846, unit: "mu U/ml" },
      { name: "BMI", label: "BMI", min_val: 15, max_val: 67.1, unit: "kg/m2" },
      { name: "DiabetesPedigreeFunction", label: "Pedigree Function", min_val: 0.05, max_val: 2.42, unit: null },
      { name: "Age", label: "Age", min_val: 21, max_val: 81, unit: "years" }
    ],
    dataset_size: 253680,
    status: "ready"
  },
  {
    id: "heart",
    name: "Heart Disease",
    description: "Coronary heart disease prediction using 200,000 patient records across 13 hemodynamic features (UCI Cleveland + CDC).",
    features: [
      { name: "age", label: "Age", min_val: 29, max_val: 77, unit: "years" },
      { name: "sex", label: "Sex", min_val: 0, max_val: 1, unit: null },
      { name: "cp", label: "Chest Pain Type", min_val: 0, max_val: 3, unit: null },
      { name: "trestbps", label: "Resting Blood Pressure", min_val: 94, max_val: 200, unit: "mm Hg" },
      { name: "chol", label: "Serum Cholesterol", min_val: 126, max_val: 564, unit: "mg/dl" },
      { name: "fbs", label: "Fasting Blood Sugar > 120", min_val: 0, max_val: 1, unit: null },
      { name: "restecg", label: "Resting ECG", min_val: 0, max_val: 2, unit: null },
      { name: "thalach", label: "Max Heart Rate", min_val: 71, max_val: 202, unit: "bpm" },
      { name: "exang", label: "Exercise Angina", min_val: 0, max_val: 1, unit: null },
      { name: "oldpeak", label: "ST Depression", min_val: 0, max_val: 6.2, unit: null },
      { name: "slope", label: "ST Slope", min_val: 0, max_val: 2, unit: null },
      { name: "ca", label: "Major Vessels", min_val: 0, max_val: 3, unit: null },
      { name: "thal", label: "Thalassemia", min_val: 0, max_val: 3, unit: null }
    ],
    dataset_size: 200000,
    status: "ready"
  },
  {
    id: "kidney",
    name: "Chronic Kidney Disease",
    description: "Renal disease diagnostic module using 100,000 clinical records across 12 renal biomarkers (Apollo Hospitals, Tamil Nadu + CDC).",
    features: [
      { name: "age", label: "Age", min_val: 20, max_val: 90, unit: "years" },
      { name: "bp", label: "Blood Pressure", min_val: 50, max_val: 120, unit: "mm Hg" },
      { name: "sg", label: "Specific Gravity", min_val: 1.005, max_val: 1.025, unit: null },
      { name: "al", label: "Albumin", min_val: 0, max_val: 5, unit: "dipstick" },
      { name: "su", label: "Sugar", min_val: 0, max_val: 5, unit: "dipstick" },
      { name: "bgr", label: "Blood Glucose Random", min_val: 70, max_val: 490, unit: "mg/dL" },
      { name: "bu", label: "Blood Urea", min_val: 10, max_val: 391, unit: "mg/dL" },
      { name: "sc", label: "Serum Creatinine", min_val: 0.4, max_val: 15.2, unit: "mg/dL" },
      { name: "sod", label: "Sodium", min_val: 111, max_val: 163, unit: "mEq/L" },
      { name: "pot", label: "Potassium", min_val: 2.5, max_val: 7.6, unit: "mEq/L" },
      { name: "hemo", label: "Hemoglobin", min_val: 3.1, max_val: 17.8, unit: "g/dL" },
      { name: "htn", label: "Hypertension", min_val: 0, max_val: 1, unit: null }
    ],
    dataset_size: 100000,
    status: "ready"
  },
  {
    id: "breast_cancer",
    name: "Breast Cancer",
    description: "Cytological malignancy classification using 49,999 digitized breast mass nucleoli records (UCI Wisconsin + SMOTE).",
    features: [
      { name: "mean radius", label: "Mean Radius", min_val: 6.98, max_val: 28.11, unit: "mm" },
      { name: "mean texture", label: "Mean Texture", min_val: 9.71, max_val: 39.28, unit: null },
      { name: "mean perimeter", label: "Mean Perimeter", min_val: 43.79, max_val: 188.5, unit: "mm" },
      { name: "mean area", label: "Mean Area", min_val: 143.5, max_val: 2501.0, unit: "mm²" },
      { name: "mean smoothness", label: "Mean Smoothness", min_val: 0.05, max_val: 0.16, unit: null },
      { name: "mean compactness", label: "Mean Compactness", min_val: 0.02, max_val: 0.35, unit: null }
    ],
    dataset_size: 49999,
    status: "ready"
  }
];

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
    console.warn('Backend diseases endpoint unavailable, using cached schema:', err);
  }
  return FALLBACK_DISEASES;
};

export const getDisease = async (id: string): Promise<DiseaseInfo> => {
  try {
    const { data } = await api.get<DiseaseInfo>(`/diseases/${id}`);
    if (data && data.features) return data;
  } catch (err) {
    console.warn(`Backend disease detail for ${id} unavailable, using cached schema:`, err);
  }
  return FALLBACK_DISEASES.find(d => d.id === id) || FALLBACK_DISEASES[0];
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
