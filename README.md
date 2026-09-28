# ArogyaDristi (आरोग्यदृष्टि)

<div align="center">

### Hybrid Quantum-Classical Intelligence for Pre-Symptomatic Chronic Disease Detection

[![SIH 2026](https://img.shields.io/badge/SIH%202026-Problem%2026139-blue?style=for-the-badge)](https://www.sih.gov.in)
[![Team](https://img.shields.io/badge/Team-Code%20(404)-navy?style=for-the-badge)](/)
[![Institute](https://img.shields.io/badge/Institute-NIT%20Nagaland-teal?style=for-the-badge)](https://nitnagaland.ac.in)
[![Quantum](https://img.shields.io/badge/Quantum-PennyLane%20VQC%20(6--Qubit)-purple?style=for-the-badge)](https://pennylane.ai)
[![Automated Tests](https://img.shields.io/badge/Tests-70%2F70%20Passing-brightgreen?style=for-the-badge)](/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**⚠️ Research & Clinical Decision-Support Prototype — Developed for Smart India Hackathon 2026**

[🌐 Live Prototype](https://quantumhealth-ai.onrender.com) · [📑 Interactive API Docs](https://quantumhealth-ai.onrender.com/docs) · [📐 Architecture](docs/architecture.md) · [🔬 Quantum Circuits](docs/quantum-workflow.md)

</div>

---

## 🎯 Smart India Hackathon (SIH) 2026 Alignment

* **Problem Statement ID**: **#26139**
* **Title**: Hybrid Quantum Machine Learning Platform for Early Disease Detection
* **Theme**: MedTech / BioTech / HealthTech | **Category**: Software
* **Team**: **Code (404)** | **Institute**: National Institute of Technology Nagaland

> *"Develop a Hybrid Quantum-Classical Machine Learning platform for early disease detection, particularly for complex biomedical data where conventional ML faces challenges related to high dimensionality, noise, and complex patterns."*

**ArogyaDristi** answers this challenge with an edge-ready, zero-GPU hybrid quantum-classical architecture validated across **211,833 real-world patient records** from the Dryad/BMJ Open longitudinal cohort.

---

### 🏗️ Architecture Overview
 
```
┌─────────────────────────────────────────────────────────────────┐
│                    AROGYADRISTI HYBRID PIPELINE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Patient Clinical Biomarkers (Routine 13 Lab Tests)             │
│          │                                                      │
│          ▼                                                      │
│  ┌───────────────────┐   PREPROCESSING & SENTINEL LAYER         │
│  │  Data Cleaning    │   • Median clinical imputation           │
│  │  Sentinel Gate    │   • Rejection of unphysiological inputs  │
│  │  StandardScaler   │   • Z-score normalization                │
│  │  Mutual Info      │   • SelectKBest (k=6 salient features)   │
│  └────────┬──────────┘                                          │
│           │                                                     │
│           ├───────────────────────────────┐                     │
│           ▼                               ▼                     │
│  ┌───────────────────┐        ┌───────────────────────┐         │
│  │  CLASSICAL TRACK  │        │     QUANTUM TRACK     │         │
│  │  5-Model Ensemble │        │  6-Qubit PennyLane    │         │
│  │  RF, SVM, LR,     │        │  Angle Encoding [0,π] │         │
│  │  XGBoost, HistGBM │        │  Ring CNOT Entangled  │         │
│  │  (6,660 Nodes)    │        │  24 Variational Paras │         │
│  └────────┬──────────┘        └───────────┬───────────┘         │
│           │                               │                     │
│           └───────────────┬───────────────┘                     │
│                           ▼                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              CALIBRATED HYBRID CONSENSUS               │     │
│  │  • Platt-Calibrated Probability Score                  │     │
│  │  • Cross-Model Agreement & Disagreement Spread         │     │
│  │  • Local SHAP Biomarker Attribution Waterfall          │     │
│  │  • Cryptographic Tamper-Evident SHA-256 PDF Report     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏥 Validated Clinical Disease Modules

| Disease Module | Benchmark Dataset Source | Validated Cohort Size | Features Used | Quantum Wire Alloc. |
|----------------|-------------------------|----------------------|---------------|---------------------|
| 🍬 **Incident Diabetes** | Dryad / BMJ Open Longitudinal Study | **211,833 patients** | 13 lab features | 6 Qubits (Angle Enc.) |
| ❤️ **Coronary Heart Disease** | Cleveland Clinic / UCI ML Repository | **297 patients** | 13 clinical tests | 6 Qubits (Angle Enc.) |
| 🔬 **Breast Cancer (M/B)** | Wisconsin Diagnostic (WDBC) / UCI | **569 biopsies** | 30 morphological | 6 Qubits (Angle Enc.) |
| 🩺 **Chronic Kidney Disease**| Apollo Hospitals / UCI Repository | **400 patients** | 24 biomarkers | 6 Qubits (Angle Enc.) |

---

## 🗂️ Repository Structure

```
quantum-health-ai/
├── README.md                    # This file
├── CONTRIBUTING.md              # Team collaboration guide
├── CODE_OF_CONDUCT.md           # Community standards
├── .gitignore
├── .github/
│   └── workflows/               # GitHub Actions CI/CD
│       ├── backend-tests.yml
│       ├── frontend-tests.yml
│       └── full-ci.yml
├── docs/
│   ├── architecture.md          # System design
│   ├── api.md                   # API reference
│   ├── quantum-workflow.md      # Quantum pipeline details
│   └── setup.md                 # Development setup
├── frontend/                    # 👤 Team Member 1 — React UI
│   └── src/
│       ├── pages/               # 6 application pages
│       ├── components/          # Reusable UI components
│       ├── services/            # API client
│       ├── hooks/               # Custom React hooks
│       └── types/               # TypeScript interfaces
├── backend/                     # 👤 Team Members 2, 3, 4
│   ├── main.py                  # FastAPI entry point
│   ├── requirements.txt
│   └── app/
│       ├── api/                 # 👤 TM4 — FastAPI routes
│       ├── core/                # 👤 TM4 — Config, database
│       ├── schemas/             # 👤 TM4 — Pydantic models
│       ├── datasets/            # 👤 TM2 — Dataset loaders
│       ├── preprocessing/       # 👤 TM2 — Data pipeline
│       ├── classical_ml/        # 👤 TM2 — ML models
│       ├── quantum_ml/          # 👤 TM3 — PennyLane VQC
│       ├── hybrid_ml/           # 👤 TM3 — Hybrid pipeline
│       ├── explainability/      # 👤 TM2/TM3 — SHAP, FI
│       ├── services/            # 👤 TM4 — Orchestration
│       └── utils/               # Shared utilities
├── tests/
│   └── backend/                 # Backend tests
├── shared/
│   └── api-contracts/           # TypeScript API contracts
├── data/
│   ├── sample/                  # Sample CSV datasets
│   └── processed/               # Preprocessed data cache
├── scripts/
│   └── setup.ps1                # Windows setup script
└── notebooks/                   # Jupyter exploration
```

---

## 👥 Team Structure

| Member | Role | Primary Folders |
|--------|------|----------------|
| TM1 | Frontend & UX | `frontend/` |
| TM2 | Classical ML & Data Pipeline | `backend/app/preprocessing/`, `classical_ml/`, `datasets/` |
| TM3 | Quantum & Hybrid ML | `backend/app/quantum_ml/`, `hybrid_ml/` |
| TM4 | Backend Integration & DevOps | `backend/app/api/`, `core/`, `.github/` |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ (`python --version`)
- Node.js 18+ (`node --version`)
- Git

### Option A: Automated Setup (Windows)

```powershell
git clone https://github.com/rohitgupta152311-rgb/ArogyaDristi.git
cd ArogyaDristi
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup.ps1
```

### Option B: Manual Setup

**Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

**Frontend (new terminal):**
```powershell
cd frontend
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm install
npm run dev
```

### Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/diseases` | List all disease modules |
| GET | `/api/v1/diseases/{id}` | Disease info + feature definitions |
| POST | `/api/v1/predict` | Run hybrid prediction |
| POST | `/api/v1/datasets/upload` | Upload validated custom CSV |
| GET | `/api/v1/datasets/uploads` | List uploaded datasets |
| GET | `/api/v1/models` | List trained models |
| GET | `/api/v1/model-comparison` | Classical vs Hybrid metrics |
| POST | `/api/v1/models/train` | Force training with held-out test and CV metadata |
| GET | `/api/v1/quantum-config` | Quantum circuit configuration |
| GET | `/api/v1/experiment-results` | Historical results |

---

## 🔬 Unique Features

### 1. Quantum Readiness Analyzer
Analyzes your dataset and shows how suitable it is for the quantum pipeline:
- Original vs selected features
- Qubits required
- Dimensionality reduction ratio
- Encoding method and circuit depth
- Quantum simulation status

### 2. Quantum-Classical Consensus Engine
Combines predictions from RF + SVM + LR + VQC:
- **Strong Agreement**: All models agree → higher confidence
- **Moderate Agreement**: Majority agrees → moderate confidence
- **Disagreement Detected**: Quantum and classical disagree → flags for clinical review

### 3. Honest Model Comparison
Transparent comparison showing when classical models outperform quantum:
- `hybrid_better` | `classical_better` | `similar_performance` | `further_research_required`

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python, FastAPI, Uvicorn |
| Classical ML | scikit-learn, pandas, numpy |
| Quantum ML | PennyLane (default.qubit simulator) |
| Explainability | SHAP, permutation importance |
| Database | SQLite (prototype) |
| Testing | pytest, Vitest |
| CI/CD | GitHub Actions |

---

## ⚠️ Important Disclaimers

> **Quantum Simulation Mode**: All quantum computations are performed using PennyLane's `default.qubit` software simulator. No real quantum hardware is used or required.

> **Research Platform**: This is an experimental research and educational platform developed for SIH 2026. It is NOT a medical device and must NOT be used for clinical diagnosis.

> **Quantum Advantage**: This platform does not claim guaranteed quantum advantage. Results honestly reflect experimental comparisons between classical and hybrid quantum-classical approaches.

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">
  
**SIH 2026 | Problem Statement 26139 | Egreen Quanta | MedTech/BioTech/HealthTech**

*"How can Hybrid Quantum-Classical Machine Learning be used for early disease detection when current quantum hardware is still limited?"*

</div>
