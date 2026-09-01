"""Unit tests for dual-scaler preprocessing pipeline and QuantumClassifier load parameter preservation."""
import tempfile
from pathlib import Path
import numpy as np
import pytest

from app.preprocessing.pipeline import PreprocessingPipeline
from app.quantum_ml.vqc import QuantumClassifier


def test_quantum_inputs_are_minmax_scaled():
    """Quantum inputs must be strictly MinMax-scaled into [0, 1]."""
    np.random.seed(42)
    # Generate arbitrary raw feature data with wide range
    X = np.random.uniform(-500.0, 1500.0, size=(100, 8))
    y = (X[:, 0] > 500).astype(int)
    feature_names = [f"feat_{i}" for i in range(8)]

    pipeline = PreprocessingPipeline(n_quantum_features=4)
    pipeline.fit(X, y, feature_names)

    X_classical, X_quantum = pipeline.transform(X)

    # Quantum features must be in [0, 1]
    assert X_quantum.shape == (100, 4)
    assert np.all(X_quantum >= 0.0), "Quantum features must be >= 0.0"
    assert np.all(X_quantum <= 1.0), "Quantum features must be <= 1.0"
    assert np.min(X_quantum) == pytest.approx(0.0, abs=1e-5)
    assert np.max(X_quantum) == pytest.approx(1.0, abs=1e-5)


def test_classical_inputs_use_standard_scaler():
    """Classical inputs must be standardized (mean ~0, std ~1)."""
    np.random.seed(42)
    X = np.random.normal(loc=50.0, scale=15.0, size=(200, 6))
    y = (X[:, 0] > 50).astype(int)
    feature_names = [f"feat_{i}" for i in range(6)]

    pipeline = PreprocessingPipeline(n_quantum_features=4)
    pipeline.fit(X, y, feature_names)

    X_classical, X_quantum = pipeline.transform(X)

    # Classical features should have approx 0 mean and 1 std
    assert X_classical.shape == (200, 6)
    np.testing.assert_allclose(np.mean(X_classical, axis=0), 0.0, atol=1e-2)
    np.testing.assert_allclose(np.std(X_classical, axis=0), 1.0, atol=1e-2)


def test_select_k_best_fitted_only_on_training_data():
    """SelectKBest and scalers must be fitted on training data, transform unseen test data correctly."""
    np.random.seed(42)
    X_train = np.random.uniform(0, 100, size=(80, 8))
    y_train = (X_train[:, 0] + X_train[:, 1] > 100).astype(int)
    feature_names = [f"f_{i}" for i in range(8)]

    pipeline = PreprocessingPipeline(n_quantum_features=4)
    pipeline.fit(X_train, y_train, feature_names)

    selected_indices = pipeline.selector.selected_indices
    assert len(selected_indices) == 4

    # Transform test set without refitting
    X_test = np.random.uniform(0, 100, size=(20, 8))
    X_test_classical, X_test_quantum = pipeline.transform(X_test)

    assert X_test_classical.shape == (20, 8)
    assert X_test_quantum.shape == (20, 4)
    assert np.all(X_test_quantum >= 0.0)
    assert np.all(X_test_quantum <= 1.0)


def test_preprocessing_pipeline_save_and_load():
    """Fitted pipeline can be saved to disk and loaded back with identical transform outputs."""
    np.random.seed(42)
    X = np.random.uniform(10, 200, size=(50, 5))
    y = (X[:, 2] > 100).astype(int)
    feature_names = ["a", "b", "c", "d", "e"]

    pipeline = PreprocessingPipeline(n_quantum_features=3, model_version="v1.0")
    pipeline.fit(X, y, feature_names)

    X_c_orig, X_q_orig = pipeline.transform(X)

    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = Path(tmpdir) / "pipeline.pkl"
        pipeline.save(save_path)

        loaded_pipeline = PreprocessingPipeline().load(save_path)
        X_c_loaded, X_q_loaded = loaded_pipeline.transform(X)

        np.testing.assert_allclose(X_c_orig, X_c_loaded, rtol=1e-6)
        np.testing.assert_allclose(X_q_orig, X_q_loaded, rtol=1e-6)
        assert loaded_pipeline.selector.selected_names == pipeline.selector.selected_names


def test_vqc_save_load_preserves_parameters_and_probabilities():
    """
    QuantumClassifier.load() must preserve exact trained parameters
    and produce identical prediction probabilities before and after loading.
    """
    np.random.seed(42)
    n_samples = 30
    n_qubits = 4
    X = np.random.uniform(0.0, 1.0, size=(n_samples, n_qubits))
    y = np.random.randint(0, 2, size=n_samples)

    # Train classifier
    qc = QuantumClassifier(n_qubits=n_qubits, n_layers=2, n_epochs=20, max_training_samples=30)
    qc.fit(X, y)

    # Compute probabilities before saving
    proba_before = qc.predict_proba(X)
    params_before = np.copy(qc.params)

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "vqc_model.pkl"
        qc.save(model_path)

        # Load into a fresh QuantumClassifier instance
        qc_loaded = QuantumClassifier(n_qubits=n_qubits, n_layers=2)
        qc_loaded.load(model_path)

        # 1. Parameters must be exactly preserved
        np.testing.assert_allclose(
            params_before,
            qc_loaded.params,
            rtol=1e-7,
            err_msg="VQC parameters were corrupted or re-initialized after load().",
        )

        # 2. Prediction probabilities before and after load must be equal within tolerance
        proba_after = qc_loaded.predict_proba(X)
        np.testing.assert_allclose(
            proba_before,
            proba_after,
            atol=1e-6,
            err_msg="VQC prediction probabilities before and after load() do not match.",
        )
