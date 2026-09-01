"""Tests for model comparison — real metrics only, no artificial boosts."""
import pytest
import numpy as np

from app.utils.metrics import evaluate_model, evaluate_model_safe, get_model_comparison


# ---- Helpers --------------------------------------------------------------

class _DummyModel:
    """Minimal model that returns fixed predictions for testing metrics."""

    def __init__(self, predictions: np.ndarray, probabilities: np.ndarray):
        self._pred = predictions
        self._proba = probabilities

    def predict(self, X):
        return self._pred[: len(X)]

    def predict_proba(self, X):
        return self._proba[: len(X)]


# ---- Tests ----------------------------------------------------------------

def test_real_metrics_only():
    """
    get_model_comparison must use the exact dicts passed in and NOT
    add any hardcoded improvements.
    """
    classical = {
        "accuracy": 0.80,
        "precision": 0.75,
        "recall": 0.70,
        "f1_score": 0.72,
        "auc_roc": 0.85,
        "confusion_matrix": [[40, 10], [15, 35]],
    }
    quantum = {
        "accuracy": 0.78,
        "precision": 0.73,
        "recall": 0.68,
        "f1_score": 0.70,
        "auc_roc": 0.82,
        "confusion_matrix": [[38, 12], [17, 33]],
    }
    hybrid = {
        "accuracy": 0.82,
        "precision": 0.77,
        "recall": 0.72,
        "f1_score": 0.74,
        "auc_roc": 0.87,
        "confusion_matrix": [[42, 8], [14, 36]],
    }

    result = get_model_comparison(classical, quantum, hybrid)

    # Must return the EXACT dicts we passed in (no modifications)
    assert result["classical"] is classical
    assert result["quantum"] is quantum
    assert result["hybrid"] is hybrid

    # Improvements are real deltas
    for key in ("accuracy", "precision", "recall", "f1_score", "auc_roc"):
        expected_delta = hybrid[key] - classical[key]
        assert abs(result["improvement"][key] - expected_delta) < 1e-9


def test_negative_improvement_reported():
    """
    If the hybrid model is worse than classical, the improvement must be
    negative — not zero or positive.
    """
    classical = {
        "accuracy": 0.90,
        "precision": 0.88,
        "recall": 0.85,
        "f1_score": 0.86,
        "auc_roc": 0.92,
        "confusion_matrix": [[45, 5], [8, 42]],
    }
    # Worse hybrid
    hybrid = {
        "accuracy": 0.82,
        "precision": 0.80,
        "recall": 0.78,
        "f1_score": 0.79,
        "auc_roc": 0.85,
        "confusion_matrix": [[40, 10], [12, 38]],
    }
    quantum = hybrid.copy()  # doesn't matter for this test

    result = get_model_comparison(classical, quantum, hybrid)

    for key in ("accuracy", "precision", "recall", "f1_score", "auc_roc"):
        assert result["improvement"][key] < 0, (
            f"Improvement for {key} should be negative when hybrid is worse"
        )


def test_evaluate_model_produces_real_values():
    """evaluate_model should return metrics between 0 and 1."""
    y_test = np.array([0, 0, 1, 1, 1, 0, 1, 0, 1, 0])
    y_pred = np.array([0, 1, 1, 1, 0, 0, 1, 0, 1, 1])
    proba = np.column_stack([1 - y_pred.astype(float), y_pred.astype(float)])

    model = _DummyModel(y_pred, proba)
    X_test = np.zeros((len(y_test), 2))  # features don't matter for dummy

    metrics = evaluate_model(model, X_test, y_test)

    for key in ("accuracy", "precision", "recall", "f1_score", "auc_roc"):
        assert 0 <= metrics[key] <= 1, f"{key} out of range"
    assert "confusion_matrix" in metrics


def test_evaluate_model_safe_single_class():
    """evaluate_model_safe should set auc_roc=None for single-class test set."""
    y_test = np.array([1, 1, 1, 1, 1])
    y_pred = np.array([1, 1, 0, 1, 1])
    proba = np.column_stack([1 - y_pred.astype(float), y_pred.astype(float)])

    model = _DummyModel(y_pred, proba)
    X_test = np.zeros((len(y_test), 2))

    metrics = evaluate_model_safe(model, X_test, y_test)
    assert metrics["auc_roc"] is None
    assert 0 <= metrics["accuracy"] <= 1
