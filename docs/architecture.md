# QuantumHealth AI — Architecture Documentation

## System Overview

QuantumHealth AI is a Hybrid Quantum-Classical Machine Learning platform for early disease detection. It combines classical ML preprocessing, PennyLane quantum simulation, and a hybrid decision layer.

---

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Port 5173)                    │
│                    React 18 + TypeScript + Vite                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Landing  │  │ Disease  │  │ Quantum  │  │ Model Comparison │ │
│  │  Page    │  │ Analysis │  │   Lab    │  │   Dashboard      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              API Service (axios → localhost:8000)            │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                               │ HTTP/REST
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND (Port 8000)                      │
│                    FastAPI + Python 3.13                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    API Layer (FastAPI)                     │  │
│  │  /health  /diseases  /predict  /models  /quantum  /expts  │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │              PredictionService (Orchestrator)              │  │
│  └──────────┬──────────────────────────────────┬─────────────┘  │
│             │                                  │                 │
│  ┌──────────▼──────────┐         ┌─────────────▼─────────────┐  │
│  │  Classical ML Layer │         │    Quantum ML Layer        │  │
│  │  (Team Member 2)    │         │    (Team Member 3)         │  │
│  │                     │         │                            │  │
│  │  ┌───────────────┐  │         │  ┌──────────────────────┐  │  │
│  │  │ DataCleaner   │  │         │  │  AngleEncoding       │  │  │
│  │  │ Normalizer    │  │         │  │  (RY gates on qubits)│  │  │
│  │  │ FeatureSelect │  │         │  └──────────────────────┘  │  │
│  │  └───────────────┘  │         │  ┌──────────────────────┐  │  │
│  │  ┌───────────────┐  │         │  │  VQC Circuit         │  │  │
│  │  │ RandomForest  │  │         │  │  (PennyLane Sim.)    │  │  │
│  │  │ SVM           │  │         │  └──────────────────────┘  │  │
│  │  │ LogisticReg   │  │         │  ┌──────────────────────┐  │  │
│  │  └───────────────┘  │         │  │  HybridModel         │  │  │
│  └─────────────────────┘         │  │  ConsensusEngine     │  │  │
│                                  │  └──────────────────────┘  │  │
│                                  └───────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Explainability Layer                       │  │
│  │              SHAP + Feature Importance + Permutation         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Data Layer (SQLite)                        │  │
│  │              ExperimentResults + Model Cache (joblib)        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Hybrid Quantum-Classical Pipeline

```
                    Patient Data (8-30 features)
                             │
                             ▼
              ┌─────────────────────────────┐
              │     Data Cleaning           │
              │  • Missing value imputation │
              │  • Outlier clipping (3σ)    │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │     Feature Normalization   │
              │  • StandardScaler           │
              │  • MinMax [0,1]             │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │     Feature Selection       │
              │  • SelectKBest (mutual_info)│
              │  • Top 4-8 features         │
              └──────────────┬──────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
        ┌───────────────────┐  ┌────────────────────────────┐
        │   CLASSICAL ML    │  │      QUANTUM ML            │
        │                   │  │                            │
        │  RandomForest     │  │  Angle Encoding            │
        │  SVM              │  │  RY(π·x_i) on qubit_i     │
        │  LogisticRegr.    │  │                            │
        │                   │  │  VQC Circuit:              │
        │  → P(disease|X)   │  │  RY+RZ+CNOT (ring)        │
        └────────┬──────────┘  │                            │
                 │             │  → ⟨Z₀⟩ measurement       │
                 │             │  → sigmoid → P(disease|X) │
                 │             └────────────┬───────────────┘
                 │                          │
                 └──────────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────┐
              │     HYBRID FUSION           │
              │  P_hybrid = 0.6·P_classical │
              │           + 0.4·P_quantum   │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │     CONSENSUS ENGINE        │
              │  Classical: High/Low Risk   │
              │  Quantum: High/Low Risk     │
              │  → Agreement Level          │
              │  → Clinical Recommendation  │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │     EXPLAINABILITY          │
              │  • SHAP values              │
              │  • Feature importance       │
              │  • Risk percentage          │
              └─────────────────────────────┘
```

---

## Quantum Circuit Architecture

### Variational Quantum Classifier (VQC)

The quantum circuit uses **Angle Encoding** followed by **variational layers**:

```
Input: 6 normalized features [x₀, x₁, x₂, x₃, x₄, x₅] ∈ [0,1]

Encoding Layer:
  q₀ |0⟩ ─── RY(π·x₀) ─────────────────────────────────────
  q₁ |0⟩ ─── RY(π·x₁) ─────────────────────────────────────
  q₂ |0⟩ ─── RY(π·x₂) ─────────────────────────────────────
  q₃ |0⟩ ─── RY(π·x₃) ─────────────────────────────────────
  q₄ |0⟩ ─── RY(π·x₄) ─────────────────────────────────────
  q₅ |0⟩ ─── RY(π·x₅) ─────────────────────────────────────

Variational Layer (repeated n_layers times):
  ── RY(θ₀) ── RZ(φ₀) ──●───────────────────────────────────
  ── RY(θ₁) ── RZ(φ₁) ──⊕──●────────────────────────────────
  ── RY(θ₂) ── RZ(φ₂) ──────⊕──●─────────────────────────────
  ── RY(θ₃) ── RZ(φ₃) ──────────⊕──●──────────────────────────
  ── RY(θ₄) ── RZ(φ₄) ──────────────⊕──●───────────────────── 
  ── RY(θ₅) ── RZ(φ₅) ──────────────────⊕──●────────────────
                         (Ring: CNOT q₅→q₀)

Measurement:
  ⟨Z₀⟩ → sigmoid → P(disease)
```

**Parameters**: `n_layers × n_qubits × 2` = `2 × 6 × 2 = 24` parameters
**Optimizer**: Nelder-Mead (gradient-free, efficient for simulated QC)
**Backend**: PennyLane `default.qubit` (software simulation)

---

## Data Flow

### Prediction Request
```
POST /api/v1/predict
{
  "disease": "diabetes",
  "features": {
    "Glucose": 120, "BMI": 28.5, ...
  },
  "mode": "hybrid"
}
```

### Internal Processing Steps
1. **DataCleaner**: Handle any missing/invalid values
2. **FeatureNormalizer**: Normalize to [0,1] using fitted StandardScaler
3. **FeatureSelector**: Select top 6 features using mutual information
4. **ClassicalMLTrainer**: Run RF, SVM, LR predictions
5. **HybridPipeline.predict_quantum()**: Run PennyLane VQC
6. **HybridPipeline.get_hybrid_result()**: Weighted combination
7. **ConsensusEngine.build_consensus()**: Agreement analysis
8. **FeatureImportance**: Rank factors by contribution
9. **QuantumReadinessAnalyzer**: Generate readiness metrics

---

## Database Schema

```sql
CREATE TABLE experiment_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    disease     TEXT NOT NULL,
    model_type  TEXT NOT NULL,  -- 'classical', 'quantum', 'hybrid'
    metrics_json TEXT NOT NULL, -- JSON blob of ModelMetrics
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Key Design Decisions

### Why Nelder-Mead for VQC Optimization?
Gradient-based optimization of PennyLane circuits requires the parameter shift rule, which is computationally expensive for demonstration purposes. Nelder-Mead is gradient-free and converges faster for small circuits in simulation mode.

### Why Angle Encoding?
Angle encoding (RY rotations) is the most practical encoding for near-term quantum devices:
- Requires only 1 qubit per feature
- Simple to implement and explain
- Works well with normalized [0,1] data
- Amplitude encoding would need exponentially more qubits

### Why 60/40 Classical/Quantum Weighting?
The hybrid fusion uses 60% classical and 40% quantum contribution because:
- Classical models have more training data history
- Quantum circuits have fewer training samples (limited for speed)
- This can be adjusted as quantum training improves

### Why Use a Subset for Quantum Training?
Full quantum circuit training on all samples is very slow in simulation mode. We use max 100 samples for training to keep the MVP responsive. Larger quantum training can be done offline and cached.
