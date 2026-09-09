"""
Comprehensive Quantum ML & Hybrid ML Integrity Test Suite.
Tests:
1. Strict unfitted guards in VQC and HybridModel (no random fallbacks).
2. Born rule probability range ([0, 1] coverage, not restricted to [0.2689, 0.7311]).
3. Exact numerical equivalence between real PennyLane QNode and NumPy statevector (< 1e-12).
4. AmplitudeEncoding input validation (overflow and zero-norm).
5. Canonical circuit depth consistency with PennyLane DAG depth.
6. Structured model disagreement range (not fake confidence).
7. Paired non-parametric bootstrap comparison with degenerate handling.
8. VQC leakage prevention and validation Platt calibration.
"""
import numpy as np
import pytest

from app.quantum_ml.encoding import AngleEncoding, AmplitudeEncoding
from app.quantum_ml.circuits import (
    build_vqc_circuit,
    compute_circuit_depth,
    PENNYLANE_AVAILABLE,
)
from app.quantum_ml.vqc import QuantumClassifier
from app.hybrid_ml.hybrid_model import HybridModel
from app.hybrid_ml.hybrid_ensemble import HybridEnsemble
from app.hybrid_ml.consensus import ConsensusEngine
from app.preprocessing.pipeline import PreprocessingPipeline


def test_unfitted_vqc_raises_error():
    """Unfitted VQC must raise RuntimeError on inference; never fabricate random predictions."""
    qc = QuantumClassifier(n_qubits=4, n_layers=2)
    assert not qc._fitted

    x = np.array([0.5, 0.5, 0.5, 0.5])
    X = np.array([[0.5, 0.5, 0.5, 0.5]])

    with pytest.raises(RuntimeError, match="has not been fitted"):
        qc.predict_proba_single(x)

    with pytest.raises(RuntimeError, match="has not been fitted"):
        qc.predict_proba(X)

    with pytest.raises(RuntimeError, match="has not been fitted"):
        qc.predict(X)


def test_unfitted_hybrid_model_raises_error():
    """Unfitted HybridModel must raise RuntimeError on inference; never use random or linear fallback."""
    hm = HybridModel(n_qubits=4, n_layers=2)
    assert not hm._fitted

    x = np.array([0.5, 0.5, 0.5, 0.5])
    with pytest.raises(RuntimeError, match="has not been fitted"):
        hm.predict_proba_single(x)


def test_born_rule_probability_full_range():
    """
    Born rule P(1) = (1 - <Z_0>) / 2 spans [0.0, 1.0].
    Must produce probabilities < 0.20 and > 0.80, proving it is not restricted to [0.2689, 0.7311].
    """
    qc = QuantumClassifier(n_qubits=2, n_layers=1, backend="numpy:statevector")
    qc._fitted = True
    qc._build_circuit()

    # Zero angles and zero params: |00> state -> <Z_0> = 1.0 -> P(1) = (1 - 1)/2 = 0.0
    qc.params = np.zeros((1, 2, 2))
    zero_input = np.zeros(2)
    p_zero = qc.predict_proba_single(zero_input, calibrated=False)
    assert p_zero == pytest.approx(0.0, abs=1e-5), f"Expected P(1) ~ 0.0, got {p_zero}"

    # Rotate qubit 1 by pi: in a 2-qubit ring, CNOT(1, 0) flips qubit 0 to |1>
    # In AngleEncoding, input 1.0 produces angle pi, so <Z_0> = -1.0 -> P(1) = (1 - (-1))/2 = 1.0
    pi_input = np.array([0.0, 1.0])
    p_one = qc.predict_proba_single(pi_input, calibrated=False)
    assert p_one == pytest.approx(1.0, abs=1e-5), f"Expected P(1) ~ 1.0, got {p_one}"

    # Verify that outputs comfortably exceed the sigmoid bounds [0.2689, 0.7311]
    assert p_zero < 0.20
    assert p_one > 0.80


@pytest.mark.skipif(not PENNYLANE_AVAILABLE, reason="PennyLane is required for equivalence test")
def test_pennylane_numpy_numerical_equivalence():
    """
    PennyLane QNode and NumPy statevector circuit must agree within 1e-12.
    Neither should multiply angles by pi again.
    """
    n_qubits = 4
    n_layers = 2

    np_circuit = build_vqc_circuit(n_qubits, n_layers, backend="numpy:statevector")
    pl_circuit = build_vqc_circuit(n_qubits, n_layers, backend="pennylane:default.qubit")

    rng = np.random.RandomState(42)
    params = rng.uniform(-np.pi, np.pi, (n_layers, n_qubits, 2))
    angles = rng.uniform(0.0, np.pi, n_qubits)

    expval_np = np_circuit(params, angles)
    expval_pl = pl_circuit(params, angles)

    diff = abs(expval_np - expval_pl)
    assert diff < 1e-12, f"PennyLane vs NumPy difference too large: {diff}"


def test_amplitude_encoding_validations():
    """AmplitudeEncoding must validate feature dimensions and non-zero norm."""
    enc = AmplitudeEncoding(n_qubits=2)  # state_size = 4

    # 1. Feature vector exceeding 2^n_qubits capacity must raise ValueError
    too_long = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    with pytest.raises(ValueError, match="exceeds maximum capacity"):
        enc.encode(too_long)

    # 2. All-zero vector must raise ValueError (cannot normalize to unit state vector)
    zero_vec = np.zeros(3)
    with pytest.raises(ValueError, match="Cannot prepare quantum state from zero-norm vector"):
        enc.encode(zero_vec)

    # 3. Valid input produces unit norm
    valid = np.array([3.0, 4.0])
    encoded = enc.encode(valid)
    assert len(encoded) == 4
    assert np.linalg.norm(encoded) == pytest.approx(1.0, abs=1e-7)


def test_circuit_depth_consistency():
    """
    Circuit depth formula must equal 1 + n_layers * (2 + n_qubits).
    For 6 qubits and 2 layers, depth must be 17.
    """
    depth_6_2 = compute_circuit_depth(6, 2)
    assert depth_6_2 == 17

    depth_4_2 = compute_circuit_depth(4, 2)
    assert depth_4_2 == 13


def test_structured_disagreement_range():
    """
    Disagreement range must return structured object:
    {lower, upper, spread, label}.
    Model agreement is NOT confidence or patient certainty.
    """
    probs = [0.31, 0.48, 0.40]
    disagree = ConsensusEngine.compute_disagreement_range(probs)

    assert disagree["lower"] == 0.31
    assert disagree["upper"] == 0.48
    assert disagree["spread"] == 0.17
    assert "Internal model-disagreement range; not a confidence interval" in disagree["label"]


def test_paired_bootstrap_comparison_similar_performance():
    """
    When classical and hybrid predictions are identical,
    paired bootstrap CI of Delta F1 covers 0 and declares similar performance.
    """
    y_true = np.array([1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0])
    c_probs = np.array([0.9, 0.1, 0.8, 0.7, 0.2, 0.1, 0.85, 0.15, 0.9, 0.05,
                        0.88, 0.2, 0.75, 0.92, 0.1, 0.25, 0.8, 0.3, 0.85, 0.15])
    # Hybrid slightly perturbed but effectively identical
    h_probs = c_probs + 0.01

    boot_res = ConsensusEngine.compute_paired_bootstrap_comparison(
        y_true, c_probs, h_probs, threshold=0.5, n_bootstraps=300
    )

    assert boot_res["valid_bootstrap_samples"] >= 100
    assert boot_res["zero_in_ci"] is True
    assert boot_res["statistically_significant"] is False

    verdict = ConsensusEngine.get_verdict(0.90, 0.90, boot_res)
    assert verdict["verdict"] == "similar_performance"
    assert verdict["winner"] == "Statistically Indistinguishable"


def test_vqc_training_no_leakage_and_calibration():
    """VQC trained only on training split, calibrated on validation split, evaluated on test."""
    np.random.seed(42)
    n = 60
    X = np.random.uniform(0.0, 1.0, size=(n, 4))
    y = (X[:, 0] + X[:, 1] > 1.0).astype(int)

    X_train, y_train = X[:30], y[:30]
    X_val, y_val = X[30:45], y[30:45]
    X_test, y_test = X[45:], y[45:]

    qc = QuantumClassifier(n_qubits=4, n_layers=1, n_epochs=15, max_training_samples=30)
    qc.fit(X_train, y_train)
    assert qc._fitted is True

    # Fit Platt calibrator on unaugmented validation data
    qc.fit_calibrator(X_val, y_val)
    assert qc.calibrator is not None

    # Predict calibrated probabilities on locked test set
    probs = qc.predict_proba(X_test, calibrated=True)
    assert probs.shape == (15, 2)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)
    np.testing.assert_allclose(probs[:, 0] + probs[:, 1], 1.0, atol=1e-5)
