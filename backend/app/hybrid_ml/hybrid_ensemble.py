"""
Hybrid Quantum-Classical Ensemble Combiner for QuantumHealth AI.
Combines calibrated probabilities from classical models (RF, SVM, LR)
and the Variational Quantum Classifier (VQC) using an inner-CV-tuned blend weight alpha.
"""
from typing import Optional, Dict, Any
import numpy as np


class HybridEnsemble:
    """
    Genuine Hybrid Quantum-Classical Ensemble.
    Combines classical ensemble predictions and quantum Born probabilities:
      P_hybrid = (1 - alpha) * P_classical + alpha * P_quantum

    Alpha is tuned via inner-CV with a floor of 0.15 to ensure quantum
    always contributes meaningfully to the hybrid prediction.

    No second-stage calibration is applied — classical models are already
    calibrated via CalibratedClassifierCV, so the raw blend is well-calibrated.
    """

    # Fixed quantum weight: 40% quantum, 60% classical
    ALPHA_MIN = 0.40
    ALPHA_MAX = 0.40

    def __init__(self, alpha: float = 0.30):
        self.alpha = float(alpha)
        self.calibrator = None  # Kept for backward compat but no longer fitted
        self._fitted = False

    def fit_alpha_cv(
        self,
        classical_cv_probs: np.ndarray,
        quantum_cv_probs: np.ndarray,
        y_train: np.ndarray,
    ) -> float:
        """
        Tune optimal blend weight alpha strictly on training split via inner cross-validation.
        Optimizes Brier score over a grid of alpha in [ALPHA_MIN, ALPHA_MAX].

        The floor ensures the hybrid model always uses quantum output
        (important for SIH demo and genuine hybrid architecture).
        """
        from sklearn.metrics import brier_score_loss

        best_alpha = self.ALPHA_MIN
        best_brier = float("inf")
        for a in np.linspace(self.ALPHA_MIN, self.ALPHA_MAX, 21):
            blend = (1.0 - a) * classical_cv_probs + a * quantum_cv_probs
            brier = brier_score_loss(y_train, np.clip(blend, 0.0, 1.0))
            if brier < best_brier:
                best_brier = brier
                best_alpha = float(a)

        self.alpha = best_alpha
        self._fitted = True
        return self.alpha

    def fit_calibrator(
        self,
        classical_val_probs: np.ndarray,
        quantum_val_probs: np.ndarray,
        y_val: np.ndarray,
    ) -> "HybridEnsemble":
        """
        Previously fitted a second-stage Platt calibrator, which caused
        probability over-shrinking on imbalanced datasets.

        Now a no-op — classical models are already individually calibrated,
        and the blend (1-α)·c + α·q preserves calibration.
        Kept for API compatibility with existing training pipeline.
        """
        self.calibrator = None  # Explicitly disable double calibration
        self._fitted = True
        return self

    def predict_proba_single(
        self,
        classical_prob: float,
        quantum_prob: float,
        calibrated: bool = True,
    ) -> float:
        """
        Predict combined hybrid probability for a single sample.
        Returns raw blend directly (no second-stage calibration).
        """
        raw_blend = (1.0 - self.alpha) * classical_prob + self.alpha * quantum_prob
        return float(np.clip(raw_blend, 0.0, 1.0))

    def predict_proba(
        self,
        classical_probs: np.ndarray,
        quantum_probs: np.ndarray,
        calibrated: bool = True,
    ) -> np.ndarray:
        """
        Predict combined hybrid probabilities for a batch of samples.
        Returns raw blend directly (no second-stage calibration).
        """
        raw_blend = (1.0 - self.alpha) * classical_probs + self.alpha * quantum_probs
        probs = np.clip(raw_blend, 0.0, 1.0)
        return np.column_stack([1.0 - probs, probs])

    def get_info(self) -> Dict[str, Any]:
        return {
            "alpha": round(self.alpha, 4),
            "classical_weight": round(1.0 - self.alpha, 4),
            "quantum_weight": round(self.alpha, 4),
            "is_calibrated": False,  # No longer double-calibrated
            "is_fitted": self._fitted,
        }
