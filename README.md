# QuantumHealth AI

<div align="center">

![QuantumHealth AI Banner](docs/assets/banner.png)

### Hybrid Quantum-Classical Intelligence for Early Disease Detection

[![SIH 2026](https://img.shields.io/badge/SIH%202026-Problem%2026139-blue?style=for-the-badge)](https://www.sih.gov.in)
[![Organization](https://img.shields.io/badge/Organization-Egreen%20Quanta-green?style=for-the-badge)](/)
[![Theme](https://img.shields.io/badge/Theme-MedTech%20%7C%20BioTech-purple?style=for-the-badge)](/)
[![Quantum](https://img.shields.io/badge/Quantum-PennyLane%20Simulator-orange?style=for-the-badge)](https://pennylane.ai)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**⚠️ Research & Educational Platform — Not for Clinical Use**

[Live Demo](#) · [API Docs](http://localhost:8000/docs) · [Architecture](docs/architecture.md) · [Setup](docs/setup.md)

</div>

---

## 🎯 Problem Statement Alignment

**SIH 2026 | ID: 26139 | Organization: Egreen Quanta | Category: Software | Theme: MedTech/BioTech/HealthTech**

> *"Develop a Hybrid Quantum-Classical Machine Learning platform for early disease detection, particularly for complex biomedical data where conventional ML faces challenges related to high dimensionality, noise, and complex patterns."*

QuantumHealth AI directly answers this challenge by:
- Combining classical preprocessing with quantum feature encoding
- Running on **PennyLane quantum simulators** (no real hardware required)
- Providing transparent comparison between classical and hybrid quantum-classical models
- Supporting multiple biomedical disease datasets with extensible architecture

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUANTUMHEALTH AI PIPELINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Patient Data / Biomedical Dataset                             │
│          │                                                      │
│          ▼                                                      │
│  ┌───────────────────┐   CLASSICAL LAYER (Team Member 2)       │
│  │  Data Cleaning    │   • Missing value imputation            │
│  │  Normalization    │   • Outlier clipping (3σ)               │
│  │  Feature Select.  │   • StandardScaler normalization        │
│  └────────┬──────────┘   • SelectKBest (mutual info)          │
│           │              • PCA dimensionality reduction         │
│           ▼                                                     │
│  ┌───────────────────┐   QUANTUM LAYER (Team Member 3)         │
│  │  Angle Encoding   │   • RY(π·x_i) on qubit i               │
│  │  VQC Circuit      │   • Parameterized RY + RZ layers        │
│  │  CNOT Entangle.   │   • Ring topology entanglement          │
│  │  ⟨Z₀⟩ Measure.   │   • PennyLane default.qubit (SIM)      │
│  └────────┬──────────┘                                         │
│           │                                                     │
│           ▼                                                     │
│  ┌───────────────────┐   HYBRID DECISION LAYER                 │
│  │  Classical Result │   • RF + SVM + LR predictions          │
│  │  Quantum Result   │   • VQC measurement output             │
│  │  Hybrid Fusion    │   • Weighted combination (60/40)        │
│  │  Consensus Engine │   • Agreement/Disagreement analysis     │
│  └────────┬──────────┘                                         │
│           │                                                     │
│           ▼                                                     │
│  Early Disease Risk Prediction + Explainability                │
└─────────────────────────────────────────────────────────────────┘
```

### 🔬 Quantum Circuit (Simulation Mode)

```
q₀|0⟩ ─── RY(π·x₀) ─── RY(θ₀₀) ── RZ(φ₀₀) ──●──────── ⟨Z⟩
q₁|0⟩ ─── RY(π·x₁) ─── RY(θ₀₁) ── RZ(φ₀₁) ──⊕──●───── 
q₂|0⟩ ─── RY(π·x₂) ─── RY(θ₀₂) ── RZ(φ₀₂) ──────⊕──●─ 
q₃|0⟩ ─── RY(π·x₃) ─── RY(θ₀₃) ── RZ(φ₀₃) ─────────⊕─ 
          [Encoding]       [Variational Layer × n_layers]
```

**Backend: PennyLane `default.qubit` (Quantum Simulator)**

---

## 🏥 Disease Modules

| Module | Dataset | Samples | Features | Qubits Used |
|--------|---------|---------|----------|-------------|
| 🍬 Diabetes | Pima Indians Diabetes | 768 | 8 | 6 |
| ❤️ Heart Disease | Cleveland Heart Disease | 303 | 13 | 6 |
| 🔬 Breast Cancer | Wisconsin Breast Cancer | 569 | 30 | 6 |

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
git clone https://github.com/your-org/quantum-health-ai.git
cd quantum-health-ai
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup.ps1
```

### Option B: Manual Setup

**Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
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
| POST | `/api/v1/upload-dataset` | Upload custom CSV |
| GET | `/api/v1/models` | List trained models |
| GET | `/api/v1/model-comparison` | Classical vs Hybrid metrics |
| POST | `/api/v1/models/train` | Trigger model training |
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
