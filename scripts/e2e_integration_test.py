"""
QuantumHealth AI — Full End-to-End Integration Test
Validates all 3 disease modules, Classical ML, Quantum VQC (PennyLane), Hybrid pipeline, and API endpoints.
"""
import sys
import os
import asyncio
from pathlib import Path
import numpy as np
from httpx import AsyncClient, ASGITransport

# Set backend path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from main import app
from app.datasets.loader import DatasetLoader
from app.preprocessing.pipeline import PreprocessingPipeline
from app.classical_ml.trainer import ClassicalMLTrainer
from app.quantum_ml.encoding import AngleEncoding
from app.quantum_ml.vqc import QuantumClassifier
from app.quantum_ml.readiness import QuantumReadinessAnalyzer
from app.hybrid_ml.consensus import ConsensusEngine
from app.core.config import settings

def print_banner(title: str):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)

async def run_e2e_tests():
    total_passed = 0
    total_failed = 0

    def record(success: bool, name: str, detail: str = ""):
        nonlocal total_passed, total_failed
        if success:
            total_passed += 1
            print(f"  [PASS] {name} {f'({detail})' if detail else ''}")
        else:
            total_failed += 1
            print(f"  [FAIL] {name} - {detail}")

    # =========================================================================
    print_banner("1. DATASET & PREPROCESSING PIPELINE VALIDATION")
    # =========================================================================
    loader = DatasetLoader()
    diseases = ["diabetes", "heart", "breast_cancer"]

    for d in diseases:
        try:
            X, y, feature_names = loader.load(d)
            info = loader.get_disease_info(d)
            record(
                X.shape[0] > 0 and len(feature_names) == X.shape[1],
                f"Dataset: {info['name']}",
                f"{X.shape[0]} samples, {X.shape[1]} features"
            )

            # Test Preprocessing
            pipe = PreprocessingPipeline(n_quantum_features=min(6, X.shape[1]))
            pipe.fit(X, y, feature_names)
            X_norm, X_q = pipe.transform(X[:5])
            record(
                X_norm.shape == (5, X.shape[1]) and X_q.shape == (5, min(6, X.shape[1])),
                f"Preprocessing Pipeline ({d})",
                f"Full: {X_norm.shape[1]} dims -> Quantum: {X_q.shape[1]} qubits"
            )
        except Exception as e:
            record(False, f"Dataset & Preprocessing ({d})", str(e))

    # =========================================================================
    print_banner("2. CLASSICAL MACHINE LEARNING VALIDATION")
    # =========================================================================
    try:
        X, y, names = loader.load("diabetes")
        pipe = PreprocessingPipeline(n_quantum_features=6)
        pipe.fit(X, y, names)
        X_norm, _ = pipe.transform(X)

        n_train = int(len(X) * 0.8)
        trainer = ClassicalMLTrainer("diabetes_e2e", settings.models_cache_dir)
        metrics = trainer.train(
            X_norm[:n_train], y[:n_train],
            X_norm[n_train:], y[n_train:],
            names
        )

        for m in metrics:
            record(
                0.5 <= m["accuracy"] <= 1.0,
                f"Classical Model: {m['model_name']}",
                f"Acc: {m['accuracy']:.3f}, F1: {m['f1_score']:.3f}, AUC: {m['roc_auc']:.3f}"
            )
    except Exception as e:
        record(False, "Classical ML Training", str(e))

    # =========================================================================
    print_banner("3. QUANTUM ML & PENNYLANE SIMULATOR VALIDATION")
    # =========================================================================
    try:
        encoder = AngleEncoding(n_qubits=6)
        raw_feat = np.array([0.1, 0.4, 0.9, 0.2, 0.7, 0.5])
        angles = encoder.encode(raw_feat)
        record(len(angles) == 6 and np.all(angles >= 0), "Quantum Angle Encoding", "RY rotations mapped [0, pi]")

        # VQC Circuit Execution
        qc = QuantumClassifier(n_qubits=6, n_layers=2)
        q_prob = qc.predict_proba_single(raw_feat)
        record(0.0 <= q_prob <= 1.0, "PennyLane VQC Simulation", f"P(disease) = {q_prob:.4f} via default.qubit")

        # Quantum Readiness Analyzer
        analyzer = QuantumReadinessAnalyzer(n_layers=2)
        readiness = analyzer.analyze(names, names[:6])
        record(
            readiness["qubits_required"] == 6 and readiness["dimensionality_reduction_ratio"] > 0,
            "Quantum Readiness Analyzer",
            f"Dim reduction: {readiness['dimensionality_reduction_ratio']:.1%}, Qubits: {readiness['qubits_required']}"
        )
    except Exception as e:
        record(False, "Quantum ML Execution", str(e))

    # =========================================================================
    print_banner("4. HYBRID DECISION LAYER & CONSENSUS ENGINE")
    # =========================================================================
    try:
        engine = ConsensusEngine()
        votes = {"RandomForest": "high_risk", "SVM": "high_risk", "LogisticRegression": "high_risk"}
        res_agree = engine.build_consensus(votes, "high_risk", 0.84)
        record(
            res_agree["agreement"] == "strong_agreement" and not res_agree["disagreement_detected"],
            "Consensus: Strong Agreement Case",
            f"Verdict: {res_agree['final_vote']}"
        )

        res_disagree = engine.build_consensus(votes, "low_risk", 0.52)
        record(
            res_disagree["disagreement_detected"] is True,
            "Consensus: Disagreement Detection Case",
            "Flags clinical review when quantum and classical diverge"
        )
    except Exception as e:
        record(False, "Consensus Engine", str(e))

    # =========================================================================
    print_banner("5. FASTAPI REST API INTEGRATION VALIDATION")
    # =========================================================================
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Health
        res = await client.get("/api/v1/health")
        record(res.status_code == 200 and res.json()["status"] == "ok", "GET /api/v1/health", res.json()["quantum_backend"])

        # Diseases List
        res = await client.get("/api/v1/diseases")
        record(res.status_code == 200 and len(res.json()["diseases"]) == 3, "GET /api/v1/diseases", "3 disease modules available")

        # Diseases Details
        for d in diseases:
            res = await client.get(f"/api/v1/diseases/{d}")
            record(res.status_code == 200 and res.json()["id"] == d, f"GET /api/v1/diseases/{d}", f"{len(res.json()['features'])} input parameters")

        # Predict - Diabetes
        diabetes_payload = {
            "disease": "diabetes",
            "features": {
                "Pregnancies": 2, "Glucose": 135, "BloodPressure": 72,
                "SkinThickness": 28, "Insulin": 110, "BMI": 31.5,
                "DiabetesPedigreeFunction": 0.55, "Age": 42
            },
            "mode": "hybrid"
        }
        res = await client.post("/api/v1/predict", json=diabetes_payload)
        data = res.json()
        record(
            res.status_code == 200 and "hybrid_result" in data,
            "POST /api/v1/predict (Diabetes)",
            f"Risk: {data['hybrid_result']['risk_percentage']}% ({data['hybrid_result']['risk_level']})"
        )

        # Predict - Heart Disease
        heart_payload = {
            "disease": "heart",
            "features": {
                "age": 58, "sex": 1, "cp": 2, "trestbps": 140, "chol": 260,
                "fbs": 0, "restecg": 1, "thalach": 155, "exang": 1, "oldpeak": 1.8,
                "slope": 1, "ca": 1, "thal": 2
            },
            "mode": "hybrid"
        }
        res = await client.post("/api/v1/predict", json=heart_payload)
        data = res.json()
        record(
            res.status_code == 200 and "hybrid_result" in data,
            "POST /api/v1/predict (Heart Disease)",
            f"Risk: {data['hybrid_result']['risk_percentage']}% ({data['hybrid_result']['risk_level']})"
        )

        # Models List & Comparison
        res = await client.get("/api/v1/models")
        record(res.status_code == 200 and len(res.json()) >= 4, "GET /api/v1/models", f"{len(res.json())} models listed")

        res = await client.get("/api/v1/models/model-comparison?disease=diabetes")
        record(res.status_code == 200 and "models" in res.json(), "GET /api/v1/models/model-comparison", f"Winner: {res.json()['winner']}")

        # Quantum Config
        res = await client.get("/api/v1/quantum/quantum-config?disease=diabetes")
        record(res.status_code == 200 and res.json()["n_qubits"] == 6, "GET /api/v1/quantum/quantum-config", f"{res.json()['n_qubits']} qubits, {res.json()['gates_used']}")

    # =========================================================================
    print_banner(f"FINAL RESULT: {total_passed}/{total_passed + total_failed} CHECKS PASSED")
    # =========================================================================
    if total_failed == 0:
        print("  [SUCCESS] All components, pipelines, models, and API endpoints are 100% operational!")
    else:
        print(f"  [WARNING] {total_failed} checks failed.")

if __name__ == "__main__":
    asyncio.run(run_e2e_tests())
