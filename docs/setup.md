# QuantumHealth AI — Development Setup Guide

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Any | `git --version` |

---

## Windows Setup

### Step 1: Clone the Repository
```powershell
git clone https://github.com/your-org/quantum-health-ai.git
cd quantum-health-ai
```

### Step 2: Fix PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Step 3: Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# Your prompt should show (venv) now
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Frontend Setup
```powershell
# In a new terminal, from the project root
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

cd frontend
npm install
```

### Step 5: Create models cache directory
```powershell
New-Item -ItemType Directory -Force backend\models_cache
```

---

## Running the Application

### Start Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

Backend starts at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### Start Frontend (new terminal)
```powershell
cd frontend
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

Frontend at: `http://localhost:5173`

---

## First-Time Usage

1. Open `http://localhost:5173`
2. Click **"Start Disease Analysis"**
3. Select **Diabetes** disease module
4. Click **"Load Sample Data"** to fill in typical values
5. Click **"Run Analysis"**
   - The backend will **automatically train models** on first request (~30-60 seconds)
   - This training is cached for subsequent requests
6. View results in the Hybrid AI Dashboard
7. Explore the Quantum Laboratory for circuit visualization

---

## Package Descriptions

### Backend (requirements.txt)
| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `pydantic` | Data validation |
| `scikit-learn` | Classical ML |
| `pandas` / `numpy` | Data processing |
| `pennylane` | Quantum simulation |
| `shap` | Explainability |
| `joblib` | Model persistence |
| `scipy` | Scientific computing |
| `sqlalchemy` + `aiosqlite` | Async SQLite |
| `httpx` | Async HTTP client |

### Frontend (package.json)
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `recharts` | Data visualization |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `tailwindcss` | Styling |
| `vite` | Build tool |

---

## Environment Variables

Create `backend/.env` (optional):
```env
APP_NAME=QuantumHealth AI
DEBUG=true
HOST=0.0.0.0
PORT=8000
QUANTUM_N_QUBITS=6
QUANTUM_N_LAYERS=2
```

---

## Team Member Workflow

### Team Member 1 (Frontend)
```powershell
git checkout -b feature/frontend-your-feature
cd frontend
npm run dev  # Start dev server
# Make changes in frontend/src/
# Test at http://localhost:5173
```

### Team Member 2 (Classical ML)
```powershell
git checkout -b feature/classical-ml-your-feature
cd backend
.\venv\Scripts\Activate.ps1
# Work in app/preprocessing/, app/classical_ml/, app/datasets/
pytest ../tests/backend/test_preprocessing.py -v
pytest ../tests/backend/test_classical_ml.py -v
```

### Team Member 3 (Quantum ML)
```powershell
git checkout -b feature/quantum-ml-your-feature
cd backend
.\venv\Scripts\Activate.ps1
# Work in app/quantum_ml/, app/hybrid_ml/
pytest ../tests/backend/test_quantum_ml.py -v
```

### Team Member 4 (Backend/DevOps)
```powershell
git checkout -b feature/backend-api-your-feature
cd backend
.\venv\Scripts\Activate.ps1
# Work in app/api/, app/core/, app/services/
pytest ../tests/backend/test_api.py -v
# Test with: http://localhost:8000/docs
```

---

## Running Tests

```powershell
# All backend tests
cd backend
.\venv\Scripts\Activate.ps1
pytest ../tests/backend/ -v

# Specific test file
pytest ../tests/backend/test_preprocessing.py -v

# Frontend tests
cd frontend
npm test
```

---

## Troubleshooting

### "pip is not recognized"
Make sure you activated the virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

### "npm is not recognized"
Add Node.js to PATH:
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
```

### "PennyLane not found" error
The backend handles this gracefully — it falls back to classical-only mode. To install:
```powershell
pip install pennylane
```

### Backend port 8000 in use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000
# Kill it (replace PID with the actual PID)
taskkill /PID <PID> /F
```

### CORS errors
Make sure the backend is running at `http://localhost:8000` (not HTTPS).
The frontend is configured to connect to this URL automatically.

### Models not training (timeout)
The first prediction request trains all ML models. This takes:
- Classical models: ~5-10 seconds
- Quantum VQC (50 iterations, 100 samples): ~30-120 seconds
If you need faster startup, reduce `n_epochs` in VQC configuration.
