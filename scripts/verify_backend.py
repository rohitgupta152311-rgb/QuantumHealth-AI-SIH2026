"""
Smoke test: Verify backend can be imported without errors.
Run from: backend/ directory with venv activated.

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python ..\\scripts\\verify_backend.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

print("=" * 60)
print("QuantumHealth AI - Backend Verification")
print("SIH 2026 | Problem Statement 26139")
print("=" * 60)

errors = []
successes = []

def check(name, fn):
    try:
        fn()
        successes.append(name)
        print(f"  [PASS] {name}")
    except Exception as e:
        errors.append((name, str(e)))
        print(f"  [FAIL] {name}: {e}")

print("\n[1] Core imports:")
check("FastAPI", lambda: __import__("fastapi"))
check("Uvicorn", lambda: __import__("uvicorn"))
check("Pydantic", lambda: __import__("pydantic"))
check("Numpy", lambda: __import__("numpy"))
check("Pandas", lambda: __import__("pandas"))
check("Scikit-learn", lambda: __import__("sklearn"))
check("SQLAlchemy", lambda: __import__("sqlalchemy"))

print("\n[2] Quantum imports:")
def check_pennylane():
    import pennylane as qml
    dev = qml.device("default.qubit", wires=2)
    print(f"       PennyLane v{qml.__version__}, backend: default.qubit [OK]")
check("PennyLane", check_pennylane)

print("\n[3] App modules:")
check("config", lambda: __import__("app.core.config", fromlist=["settings"]))
check("schemas.disease", lambda: __import__("app.schemas.disease", fromlist=["DiseaseInfo"]))
check("schemas.prediction", lambda: __import__("app.schemas.prediction", fromlist=["PredictionRequest"]))
check("datasets.diabetes", lambda: __import__("app.datasets.diabetes", fromlist=["DiabetesDataset"]))
check("datasets.breast_cancer", lambda: __import__("app.datasets.breast_cancer", fromlist=["BreastCancerDataset"]))
check("preprocessing.pipeline", lambda: __import__("app.preprocessing.pipeline", fromlist=["PreprocessingPipeline"]))
check("classical_ml.trainer", lambda: __import__("app.classical_ml.trainer", fromlist=["ClassicalMLTrainer"]))
check("quantum_ml.vqc", lambda: __import__("app.quantum_ml.vqc", fromlist=["QuantumClassifier"]))
check("hybrid_ml.pipeline", lambda: __import__("app.hybrid_ml.pipeline", fromlist=["HybridPipeline"]))
check("hybrid_ml.consensus", lambda: __import__("app.hybrid_ml.consensus", fromlist=["ConsensusEngine"]))

print("\n[4] Dataset loading:")
def check_diabetes():
    from app.datasets.diabetes import DiabetesDataset
    ds = DiabetesDataset()
    X, y, names = ds.load()
    assert X.shape == (768, 8), f"Expected (768,8), got {X.shape}"
    print(f"       Diabetes: {X.shape[0]} samples, {X.shape[1]} features [OK]")
check("Diabetes dataset", check_diabetes)

def check_breast_cancer():
    from app.datasets.breast_cancer import BreastCancerDataset
    ds = BreastCancerDataset()
    X, y, names = ds.load()
    assert X.shape[1] == 30, f"Expected 30 features, got {X.shape[1]}"
    print(f"       Breast Cancer: {X.shape[0]} samples, {X.shape[1]} features [OK]")
check("Breast Cancer dataset", check_breast_cancer)

print("\n[5] Quick ML pipeline test:")
def check_pipeline():
    import numpy as np
    from app.preprocessing.pipeline import PreprocessingPipeline
    from app.datasets.diabetes import DiabetesDataset
    from app.classical_ml.trainer import ClassicalMLTrainer
    from pathlib import Path
    
    ds = DiabetesDataset()
    X, y, names = ds.load()
    
    # Quick 80/20 split
    n = len(X)
    X_train, X_test = X[:int(n*0.8)], X[int(n*0.8):]
    y_train, y_test = y[:int(n*0.8)], y[int(n*0.8):]
    
    pipeline = PreprocessingPipeline(n_quantum_features=6)
    pipeline.fit(X_train, y_train, names)
    X_train_norm, X_train_q = pipeline.transform(X_train)
    
    cache_dir = Path("models_cache")
    cache_dir.mkdir(exist_ok=True)
    
    trainer = ClassicalMLTrainer("diabetes_test", cache_dir)
    metrics = trainer.train(X_train_norm, y_train, 
                           pipeline.transform(X_test)[0], y_test, names)
    
    best_acc = max(m["accuracy"] for m in metrics)
    print(f"       Best classical accuracy: {best_acc:.3f} [OK]")
    
    # Test prediction
    sample = {n: float(X_test[0][i]) for i, n in enumerate(names)}
    X_norm_s, X_q_s = pipeline.transform_single(sample, names)
    results = trainer.predict_single(X_norm_s)
    print(f"       Prediction works: {results[0]['prediction']} [OK]")
check("Full ML pipeline", check_pipeline)

print("\n[6] Quantum circuit test:")
def check_quantum():
    import numpy as np
    from app.quantum_ml.vqc import QuantumClassifier
    qc = QuantumClassifier(n_qubits=4, n_layers=1)
    x_sample = np.array([0.3, 0.7, 0.5, 0.2])
    prob = qc.predict_proba_single(x_sample)
    assert 0.0 <= prob <= 1.0, f"Probability out of range: {prob}"
    print(f"       VQC output: {prob:.4f} (valid probability) [OK]")
check("VQC quantum circuit", check_quantum)

print("\n" + "=" * 60)
print(f"Results: {len(successes)}/{len(successes)+len(errors)} checks passed")
if errors:
    print("\nFailed checks:")
    for name, err in errors:
        print(f"  [FAIL] {name}: {err}")
else:
    print("\n[SUCCESS] All checks passed! Backend is ready.")
    print("\nStart the backend with:")
    print("  cd backend")
    print("  .\\venv\\Scripts\\Activate.ps1")
    print("  python main.py")
