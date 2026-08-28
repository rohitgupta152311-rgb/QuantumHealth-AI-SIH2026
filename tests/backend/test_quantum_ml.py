import pytest
import numpy as np
from app.quantum_ml.encoding import AngleEncoding, AmplitudeEncoding
from app.quantum_ml.circuits import get_circuit_info, get_feature_to_qubit_map
from app.quantum_ml.vqc import QuantumClassifier
from app.quantum_ml.readiness import QuantumReadinessAnalyzer
from app.hybrid_ml.consensus import ConsensusEngine

def test_angle_encoding():
    encoder = AngleEncoding(n_qubits=4)
    features = np.array([0.0, 0.5, 1.0, 0.25])
    angles = encoder.encode(features)
    assert len(angles) == 4
    assert np.isclose(angles[0], 0.0)
    assert np.isclose(angles[1], np.pi * 0.5)
    assert np.isclose(angles[2], np.pi * 1.0)

def test_amplitude_encoding():
    encoder = AmplitudeEncoding(n_qubits=2)
    features = np.array([1.0, 1.0, 1.0, 1.0])
    state = encoder.encode(features)
    assert len(state) == 4
    assert np.isclose(np.linalg.norm(state), 1.0)

def test_quantum_classifier_prediction():
    qc = QuantumClassifier(n_qubits=4, n_layers=1)
    x = np.array([0.2, 0.8, 0.4, 0.6])
    prob = qc.predict_proba_single(x)
    assert 0.0 <= prob <= 1.0

def test_quantum_readiness_analyzer():
    analyzer = QuantumReadinessAnalyzer(n_layers=2)
    orig = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10"]
    selected = ["f1", "f2", "f3", "f4", "f5", "f6"]
    readiness = analyzer.analyze(orig, selected)
    assert readiness["original_features"] == 10
    assert readiness["selected_features"] == 6
    assert readiness["qubits_required"] == 6
    assert readiness["dimensionality_reduction_ratio"] == 0.4

def test_consensus_engine():
    engine = ConsensusEngine()
    classical_votes = {
        "RandomForest": "high_risk",
        "SVM": "high_risk",
        "LogisticRegression": "high_risk"
    }
    consensus = engine.build_consensus(
        classical_predictions=classical_votes,
        quantum_prediction="high_risk",
        hybrid_probability=0.82
    )
    assert consensus["agreement"] == "strong_agreement"
    assert consensus["final_vote"] == "high_risk"
    assert consensus["disagreement_detected"] is False
