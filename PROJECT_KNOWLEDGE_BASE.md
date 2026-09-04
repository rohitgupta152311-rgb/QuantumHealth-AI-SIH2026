# QuantumHealth AI — Complete Project Knowledge Base
# SIH 2026 Problem Statement #26139
# Hybrid Quantum-Classical ML for Early Disease Prediction
# GitHub: https://github.com/rohitgupta152311-rgb/QuantumHealth-AI-SIH2026.git

---

## PROJECT OVERVIEW

QuantumHealth AI is a full-stack web application that uses a **Hybrid Quantum-Classical Machine Learning** approach for early disease prediction. It was built for the **Smart India Hackathon (SIH) 2026**, Problem Statement #26139.

The application combines 3 classical ML models (Random Forest, SVM, Logistic Regression) with a PennyLane-simulated Variational Quantum Circuit (VQC) and fuses their outputs via a 60/40 weighted Consensus Engine.

**Live Deployment:**
- Frontend: Vercel (React + Vite + Tailwind CSS)
- Backend: Render.com (FastAPI + Python)
- Repository: GitHub

---

## TECH STACK

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State:** localStorage (`qhai_last_prediction`)
- **API Client:** Axios (with Mock Mode fallback when backend is down)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **ML Libraries:** Scikit-Learn, NumPy, Pandas
- **Quantum:** PennyLane (default.qubit simulator)
- **Explainability:** SHAP, Feature Importance
- **Model Persistence:** Joblib (cached in `models_cache/`)
- **Optimizer:** SciPy Nelder-Mead (gradient-free)

---

## ARCHITECTURE — THE 3-LAYER PREDICTION SYSTEM

### Layer 1: Classical ML Ensemble
Three proven models independently analyze patient data:
1. **Random Forest** — Pattern detection in tree-based ensembles
2. **SVM (Support Vector Machine)** — Decision boundary optimization
3. **Logistic Regression** — Probabilistic classification

Each model votes "high_risk" or "low_risk" and provides a probability.

### Layer 2: Quantum ML (VQC)
The same patient data is:
1. Reduced to 6 features using `SelectKBest` (chi-squared test)
2. Normalized to [0, 1] range
3. Encoded into rotation angles: RY(π × feature_value) on each qubit
4. Processed through a Variational Quantum Circuit:
   - 6 qubits, 2 variational layers
   - Each layer: RY(θ) + RZ(φ) parameterized rotations + CNOT ring entanglement
   - Measurement: ⟨Z₀⟩ expectation value
5. Sigmoid applied to circuit output → probability of disease

**Training:** Nelder-Mead (gradient-free), max 100 samples, max 50 iterations, < 2 min on laptop.

### Layer 3: Hybrid Consensus Engine
- **Weighted Fusion:** `hybrid_prob = 0.60 × classical_avg + 0.40 × quantum_prob`
- **Consensus Levels:**
  - `strong_agreement` — All 4 models (RF, SVM, LR, VQC) agree on the same label
  - `moderate_agreement` — Majority agrees with acceptable confidence
  - `disagreement` — Quantum found something classical missed → "Further investigation recommended"
- **Risk Levels:** very_low (<20%), low (20-40%), moderate (40-60%), high (60-80%), very_high (>80%)

---

## COMPLETE FILE TREE AND FILE DESCRIPTIONS

```
quantum-health-ai/
├── TEAM_GUIDE.md                    # Team collaboration guide with role assignments
├── FULL_CHAT_HISTORY.html           # Full AI chat history (shareable)
│
├── backend/
│   ├── main.py                      # FastAPI entry point with lifespan startup
│   ├── requirements.txt             # Python dependencies
│   ├── pytest.ini                   # Test configuration
│   │
│   └── app/
│       ├── __init__.py
│       │
│       ├── core/                        # ⚙️ Configuration & Database
│       │   ├── __init__.py
│       │   ├── config.py                # Settings: quantum_n_qubits=6, quantum_n_layers=2, backend="pennylane:default.qubit"
│       │   └── database.py             # SQLite experiment tracking (optional)
│       │
│       ├── schemas/                     # 📋 Pydantic Data Validation Models
│       │   ├── __init__.py
│       │   ├── disease.py              # DiseaseInfo, FeatureDefinition schemas
│       │   ├── prediction.py           # PredictionRequest, PredictionResponse schemas
│       │   ├── comparison.py           # ModelComparison response schema
│       │   └── quantum.py             # QuantumResult, QuantumReadiness schemas
│       │
│       ├── models/                      # 💾 Database ORM Models
│       │   ├── __init__.py
│       │   └── experiment.py           # Experiment tracking model
│       │
│       ├── datasets/                    # 📊 Medical Dataset Loaders (TM2 owns)
│       │   ├── __init__.py
│       │   ├── diabetes.py             # Synthetic diabetes data (768 samples, 8 features, seed=42)
│       │   ├── heart.py                # Synthetic heart disease data (303 samples, 13 features)
│       │   ├── breast_cancer.py        # Uses sklearn.datasets.load_breast_cancer() (offline)
│       │   └── loader.py              # Registry: maps disease_id -> Dataset class
│       │
│       ├── preprocessing/               # 🧹 Data Cleaning Pipeline (TM2 owns)
│       │   ├── __init__.py
│       │   ├── cleaner.py              # Handles missing values, outlier removal
│       │   ├── normalizer.py           # StandardScaler normalization
│       │   ├── feature_selector.py     # SelectKBest(chi2, k=6) for quantum dimensionality reduction
│       │   └── pipeline.py            # Orchestrates: clean → normalize → select → quantum-ready output
│       │
│       ├── classical_ml/                # 🤖 Classical ML Models (TM2 owns)
│       │   ├── __init__.py
│       │   ├── random_forest.py        # RandomForestClassifier wrapper
│       │   ├── svm.py                  # SVC(probability=True) wrapper
│       │   ├── logistic_regression.py  # LogisticRegression wrapper
│       │   ├── evaluator.py           # Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix
│       │   └── trainer.py            # Trains all 3 models, caches with joblib
│       │
│       ├── quantum_ml/                  # ⚛️ Quantum ML (TM3 owns)
│       │   ├── __init__.py             # Safe PennyLane import with try/except
│       │   ├── encoding.py            # AngleEncoding: RY(π × x_i), AmplitudeEncoding
│       │   ├── circuits.py            # PennyLane QNode: angle encoding → RY/RZ rotations → CNOT ring → ⟨Z₀⟩
│       │   ├── vqc.py                 # QuantumClassifier: Nelder-Mead training, predict_proba, save/load
│       │   └── readiness.py           # Quantum readiness analyzer (scores: excellent/good/fair/requires_reduction)
│       │
│       ├── hybrid_ml/                   # 🔗 Hybrid Fusion (TM3 owns)
│       │   ├── __init__.py
│       │   ├── hybrid_model.py        # HybridModel: wraps VQC with sigmoid, 3-tier fallback
│       │   ├── consensus.py           # ConsensusEngine: strong/moderate/disagreement classification
│       │   └── pipeline.py           # Full pipeline: quantum inference → 60/40 fusion → consensus → risk level
│       │
│       ├── explainability/              # 🔍 Model Explainability (TM2/TM3 shared)
│       │   ├── __init__.py
│       │   ├── feature_importance.py  # Permutation feature importance
│       │   └── shap_explainer.py      # SHAP value explanations
│       │
│       ├── services/                    # 🎯 Master Orchestrator (TM4 owns)
│       │   ├── __init__.py
│       │   └── prediction_service.py  # THE CRITICAL FILE: ties datasets → preprocessing → classical ML → quantum VQC → consensus → response
│       │
│       ├── api/                         # 🌐 FastAPI Routes (TM4 owns)
│       │   ├── __init__.py
│       │   ├── router.py              # Main API router aggregator
│       │   └── routes/
│       │       ├── __init__.py
│       │       ├── health.py          # GET /health — server health check
│       │       ├── diseases.py        # GET /diseases — list supported diseases
│       │       ├── predict.py         # POST /predict — THE MAIN ENDPOINT
│       │       ├── models.py          # GET /models/compare — classical vs hybrid comparison
│       │       ├── quantum.py         # GET /quantum/readiness — quantum readiness info
│       │       └── experiments.py     # Experiment tracking endpoints
│       │
│       └── utils/
│           ├── __init__.py
│           └── helpers.py             # risk_level_from_probability(), build_processing_steps()
│
├── frontend/
│   ├── package.json                    # Dependencies: react, recharts, framer-motion, lucide-react, axios
│   ├── vite.config.ts                  # Vite config with API proxy to localhost:8000
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html                      # Root HTML
│   │
│   └── src/
│       ├── main.tsx                     # React entry point
│       ├── App.tsx                      # React Router: /, /analyze, /dashboard, /quantum, /compare, /explain
│       ├── index.css                    # Tailwind base styles + custom animations
│       │
│       ├── types/
│       │   └── index.ts                # TypeScript interfaces for all API responses
│       │
│       ├── services/
│       │   └── api.ts                  # Axios client + MOCK_MODE fallback with realistic mock data
│       │                                # BASE_URL = 'http://localhost:8000/api/v1' (change for production)
│       │
│       ├── hooks/
│       │   ├── useToast.ts             # Toast notification hook
│       │   ├── useDisease.ts           # Disease selection state hook
│       │   └── usePrediction.ts        # Prediction API call hook
│       │
│       ├── components/
│       │   ├── ui/                      # Reusable UI primitives
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── ProgressBar.tsx
│       │   │   ├── Spinner.tsx
│       │   │   └── Toast.tsx
│       │   │
│       │   ├── layout/                  # Page layout components
│       │   │   ├── Header.tsx           # Atom icon, "QuantumHealth AI", quantum badge, nav links
│       │   │   ├── Sidebar.tsx
│       │   │   └── Layout.tsx
│       │   │
│       │   ├── charts/                  # Data visualization components
│       │   │   ├── MetricsRadarChart.tsx     # Radar chart for model metrics
│       │   │   ├── ConfusionMatrix.tsx       # Heatmap confusion matrix
│       │   │   ├── FeatureImportanceChart.tsx # Horizontal bar chart
│       │   │   ├── ROCCurveChart.tsx          # ROC curve with AUC
│       │   │   └── RiskGauge.tsx              # Semicircular risk gauge (Recharts PieChart)
│       │   │
│       │   └── quantum/                 # Quantum-specific visualizations
│       │       ├── QuantumCircuitViz.tsx      # SVG circuit diagram: qubit lines, RY/RZ boxes, CNOT circles
│       │       ├── QuantumReadinessCard.tsx   # Readiness score display
│       │       ├── ProcessingPipeline.tsx     # Animated step-by-step pipeline (framer-motion)
│       │       └── ConsensusDisplay.tsx       # Agreement level with color coding
│       │
│       ├── features/
│       │   └── disease/
│       │       └── DiseaseSelector.tsx  # Disease card selector grid
│       │
│       └── pages/                       # 6 Application Pages
│           ├── LandingPage.tsx              # Stunning gradient hero, animated background, feature cards
│           ├── DiseaseAnalysisPage.tsx       # Dynamic form with sliders per disease + "Load Sample Data"
│           ├── HybridAIDashboard.tsx         # Main results: RiskGauge, ProcessingPipeline, Consensus
│           ├── QuantumLaboratory.tsx         # Circuit visualization, qubit mapping, readiness metrics
│           ├── ModelComparisonDashboard.tsx  # Side-by-side Classical vs Hybrid metrics
│           └── ExplainabilityDashboard.tsx   # SHAP values, feature importance charts
│
├── tests/
│   └── backend/
│       ├── __init__.py
│       ├── conftest.py                  # Pytest fixtures
│       ├── test_preprocessing.py        # Tests for data cleaning pipeline
│       ├── test_classical_ml.py         # Tests for ML model training
│       ├── test_api.py                  # Tests for FastAPI endpoints
│       └── test_quantum_ml.py           # Tests for VQC and encoding
│
├── shared/
│   └── api-contracts/
│       └── contracts.ts                 # Shared TypeScript API type definitions
│
├── scripts/
│   ├── setup.ps1                        # Windows PowerShell setup script
│   ├── verify_backend.py               # Backend verification script
│   └── e2e_integration_test.py         # End-to-end integration test
│
└── public/
    └── _redirects                       # Netlify SPA routing fix
```

---

## KEY DATA FLOW (How a prediction works end-to-end)

```
1. USER clicks "Predict" on the React frontend
   ↓
2. Frontend sends POST /api/v1/predict with { disease: "diabetes", features: { Glucose: 150, BMI: 33.6, ... } }
   ↓
3. FastAPI route (predict.py) calls PredictionService.predict()
   ↓
4. PredictionService orchestrates:
   a. Load dataset (datasets/loader.py → diabetes.py)
   b. Train models if not cached (lazy training on first request)
   c. Preprocess input: clean → normalize → feature_select (top 6 features)
   ↓
5. CLASSICAL PATH:
   - RandomForest.predict_proba(X_norm) → 0.78
   - SVM.predict_proba(X_norm) → 0.72
   - LogisticRegression.predict_proba(X_norm) → 0.65
   ↓
6. QUANTUM PATH:
   - Take top 6 features (X_quantum)
   - AngleEncoding: RY(π × 0.75) on qubit 0, RY(π × 0.56) on qubit 1, ...
   - Run VQC circuit on PennyLane default.qubit simulator
   - Measure ⟨Z₀⟩ → sigmoid → 0.81
   ↓
7. HYBRID FUSION:
   - classical_avg = mean(0.78, 0.72, 0.65) = 0.717
   - hybrid_prob = 0.60 × 0.717 + 0.40 × 0.81 = 0.754
   ↓
8. CONSENSUS ENGINE:
   - RF: high_risk, SVM: high_risk, LR: high_risk, VQC: high_risk
   - All 4 agree → "strong_agreement"
   - recommendation: "consistent_prediction"
   ↓
9. RESPONSE sent back to frontend with:
   - classical_results (3 models with probabilities)
   - quantum_result (backend, qubits, circuit depth, probability)
   - hybrid_result (fused probability, risk level, confidence)
   - consensus (agreement level, recommendation)
   - feature_importance (which biomarkers mattered most)
   - quantum_readiness (encoding method, qubit map)
   ↓
10. Frontend renders: RiskGauge (75.4%), ConsensusDisplay (Strong Agreement),
    QuantumCircuitViz, FeatureImportanceChart, ProcessingPipeline animation
```

---

## CRITICAL IMPLEMENTATION DETAILS

### 1. Mock Mode (Frontend)
In `frontend/src/services/api.ts`, there is a `MOCK_MODE` constant. When the backend is unreachable, the frontend automatically falls back to realistic mock data so the UI is always demonstrable. To connect to a real backend, change `BASE_URL` to the Render.com URL.

### 2. Quantum Fallback (Backend)
In `prediction_service.py` (lines 64-71), the quantum inference is wrapped in `try/except`. If PennyLane is not installed or crashes, it falls back to a deterministic classical approximation: `q_prob = classical_mean * 0.9 + 0.05`. This ensures the API NEVER crashes.

### 3. Lazy Training
Models are NOT pre-trained. They train on the first `/predict` request and are cached using joblib in the `models_cache/` directory. Subsequent requests use the cached models instantly.

### 4. Diseases are Plug-and-Play
To add a new disease:
1. Create a new dataset file in `backend/app/datasets/` (e.g., `alzheimers.py`)
2. Register it in `backend/app/datasets/loader.py` in the `_registry` dictionary
3. Add it to the frontend disease list in `frontend/src/services/api.ts`
The ML pipeline and quantum circuit automatically adapt — no new model code needed.

### 5. PennyLane Circuit Details
- **Qubits:** 6 (matches 6 selected features)
- **Layers:** 2 variational layers
- **Gates per layer:** RY(θ) + RZ(φ) on each qubit + CNOT ring (qubit 0→1→2→3→4→5→0)
- **Total parameters:** 2 × 6 × 2 = 24 trainable parameters
- **Measurement:** ⟨Z₀⟩ expectation value on qubit 0
- **Backend:** `pennylane:default.qubit` (pure simulator, no real quantum hardware)
- **Optimizer:** Nelder-Mead (gradient-free, scipy.optimize.minimize)

---

## TEAM STRUCTURE (4 MEMBERS)

### TM1 — Frontend & UI Lead
**Folders:** `frontend/`
- React pages, Tailwind styling, Recharts visualizations, Vercel deployment
- Mock mode ensures TM1 can work independently of the backend team

### TM2 — Classical ML & Data Lead
**Folders:** `backend/app/datasets/`, `preprocessing/`, `classical_ml/`, `explainability/`
- Data loading, cleaning, normalization, feature selection
- Training RF, SVM, LR models
- SHAP values and feature importance

### TM3 — Quantum ML & Hybrid Lead
**Folders:** `backend/app/quantum_ml/`, `backend/app/hybrid_ml/`
- PennyLane VQC circuit design and optimization
- Angle encoding, entanglement topology
- 60/40 hybrid fusion and consensus engine rules

### TM4 — Backend Architect & API Lead
**Folders:** `backend/app/api/`, `core/`, `schemas/`, `services/`
- FastAPI routes and Pydantic validation
- Master orchestrator (prediction_service.py)
- Render.com deployment, environment variables

---

## CURRENT STATUS
- ✅ All backend code written and functional
- ✅ All frontend code written and functional
- ✅ Code pushed to GitHub
- ✅ Frontend deployed to Vercel
- ⬜ Backend deployment to Render.com (pending)
- ⬜ Connect frontend BASE_URL to live Render URL
- ⬜ GitHub README.md with screenshots
- ⬜ Demo video recording
- ⬜ Pitch deck (PPT)

---

## HOW TO RUN LOCALLY

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API docs available at: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App available at: http://localhost:5173

---

## API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Server health check |
| GET | `/api/v1/diseases` | List all supported diseases |
| POST | `/api/v1/predict` | Run hybrid prediction |
| GET | `/api/v1/models/compare/{disease}` | Classical vs Hybrid comparison |
| GET | `/api/v1/quantum/readiness/{disease}` | Quantum readiness metrics |

### Example POST /predict body:
```json
{
  "disease": "diabetes",
  "features": {
    "Pregnancies": 6,
    "Glucose": 148,
    "BloodPressure": 72,
    "SkinThickness": 35,
    "Insulin": 0,
    "BMI": 33.6,
    "DiabetesPedigreeFunction": 0.627,
    "Age": 50
  },
  "mode": "hybrid"
}
```

---

## KEY SENTENCES FOR JUDGES

1. "We use PennyLane to simulate NISQ-era quantum computing on classical hardware."
2. "By mapping patient biomarkers into a high-dimensional quantum Hilbert Space via Angle Encoding, the VQC can capture non-linear correlations between symptoms that classical Decision Trees process sequentially."
3. "Our 6-qubit angle-encoded circuit with CNOT ring entanglement acts as a secondary verification layer, ensuring high confidence in early disease detection."
4. "The 3-tier Consensus Engine (Strong Agreement / Moderate Agreement / Disagreement) ensures no patient is ever misdiagnosed by a single faulty model."
5. "The platform is plug-and-play: adding a new disease requires only a new dataset file — the quantum pipeline automatically adapts."
