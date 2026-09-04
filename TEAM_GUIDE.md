# ⚛️ QuantumHealth AI - Team Guide & Division of Labor

Welcome to the **Smart India Hackathon (SIH 2026)** project! This document summarizes the architecture, the "Quantum Advantage," and exactly how the 4 team members should divide the work without overwriting each other's code.

---

## 🎯 The Core Innovation (How we win)
Traditional ML models sometimes fail on complex, non-linear medical data. Our solution uses a **3-Layer Hybrid Consensus Engine**:
1. **Classical ML:** Random Forest, SVM, and Logistic Regression process the data.
2. **Quantum ML:** We use **PennyLane (Variational Quantum Circuits)**. We convert medical data into rotation angles (Angle Encoding) and use CNOT entanglement in a 6-qubit Hilbert Space to find hidden disease patterns that classical computers miss.
3. **Consensus Engine:** A 60/40 weighted system fuses the votes. It outputs *Strong Agreement*, *Moderate Agreement*, or *Disagreement* so a doctor is never misdiagnosed by a single faulty model.

---

## 👥 Team Roles & Folder Ownership

To work simultaneously without "Merge Conflicts", everyone must stay in their assigned folders!

### 👤 Team Member 1: Frontend & UI Lead
**Your Folders:** `frontend/`
* **The Job:** You own the React UI, Tailwind styling, and Vercel deployment.
* **Goal:** Make the dashboard look stunning, ensure it works on mobile, and design the graphs. (Note: The `api.ts` file has a 'Mock Mode' so you can build the UI even if the backend is down).

### 👤 Team Member 2: Classical ML & Data Lead
**Your Folders:** `backend/app/datasets/`, `backend/app/preprocessing/`, `backend/app/classical_ml/`
* **The Job:** Clean the CSV medical data, handle missing values, and train the baseline Random Forest & SVM models.
* **Goal:** You must shrink the data down using Feature Selection to just the 6 most important features, so it is small enough to feed into TM3's quantum simulator.

### 👤 Team Member 3: Quantum ML & Hybrid Lead (The SIH Star)
**Your Folders:** `backend/app/quantum_ml/`, `backend/app/hybrid_ml/`
* **The Job:** You own the PennyLane Quantum simulation and the Consensus Engine.
* **Goal:** 
  1. Optimize the Variational Quantum Classifier (`vqc.py`). Test 3 layers instead of 2.
  2. Explain the math: *Angle Encoding converts data to RY rotations, and CNOT rings create entanglement.*
  3. Tune the Hybrid Consensus (`consensus.py`): Test the 60/40 weight split to see what gives the most realistic risk probabilities.

### 👤 Team Member 4: Backend Architect & Project Manager
**Your Folders:** `backend/app/api/`, `backend/app/core/`, `backend/app/services/`
* **The Job:** You are the bridge. You build the FastAPI routes and the master orchestration script (`prediction_service.py`) that ties TM2 and TM3's AI together.
* **Goal:** Secure the API with Pydantic schemas, deploy the backend to **Render.com**, and lead the Pitch Deck/Video creation.

---

## 🚀 How to Work Together
1. **Never edit `main` directly.** Create a branch on your laptop (e.g., `git checkout -b tm1-ui-fixes`).
2. Code your changes in your specific folders.
3. Push your branch to GitHub (`git push -u origin tm1-ui-fixes`).
4. Open a Pull Request on GitHub to safely merge it.

## 📝 Final Hackathon Checklist
- [ ] **Developer 1:** Test Vercel link on mobile.
- [ ] **Developer 2:** Generate Feature Importance graphs for the presentation.
- [ ] **Developer 3:** Memorize the "Quantum Advantage" pitch (Hilbert Space, Entanglement, NISQ-era simulation).
- [ ] **Developer 4:** Deploy Backend to Render, update the `README.md` with screenshots, and record the 2-minute YouTube Demo Video.
