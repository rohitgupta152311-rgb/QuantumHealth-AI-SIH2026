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
    Supports Platt calibration on unaugmented validation data.
    """

    def __init__(self, alpha: float = 0.40):
        self.alpha = float(alpha)
        self.calibrator = None
        self._fitted = False

    def fit_alpha_cv(
        self,
        classical_cv_probs: np.ndarray,
        quantum_cv_probs: np.ndarray,
        y_train: np.ndarray,
    ) -> float:
        """
        Tune optimal blend weight alpha strictly on training split via inner cross-validation.
        Optimizes Brier score over a grid of alpha in [0.0, 1.0].
        """
        from sklearn.metrics import brier_score_loss

        best_alpha = 0.40
        best_brier = float("inf")
        for a in np.linspace(0.0, 1.0, 21):
            blend = (1.0 - a) * classical_cv_probs + a * quantum_cv_probs
            brier = brier_score_loss(y_train, blend)
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
        Fit Platt probability calibrator on unaugmented validation split.
        """
        from sklearn.linear_model import LogisticRegression

        raw_blend = (1.0 - self.alpha) * classical_val_probs + self.alpha * quantum_val_probs
        self.calibrator = LogisticRegression(C=1.0, solver="lbfgs")
        self.calibrator.fit(raw_blend.reshape(-1, 1), y_val)
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
        """
        raw_blend = (1.0 - self.alpha) * classical_prob + self.alpha * quantum_prob
        if calibrated and self.calibrator is not None:
            cal_prob = float(self.calibrator.predict_proba([[raw_blend]])[0, 1])
            return float(np.clip(cal_prob, 0.0, 1.0))
        return float(np.clip(raw_blend, 0.0, 1.0))

    def predict_proba(
        self,
        classical_probs: np.ndarray,
        quantum_probs: np.ndarray,
        calibrated: bool = True,
    ) -> np.ndarray:
        """
        Predict combined hybrid probabilities for a batch of samples.
        """
        raw_blend = (1.0 - self.alpha) * classical_probs + self.alpha * quantum_probs
        if calibrated and self.calibrator is not None:
            probs = self.calibrator.predict_proba(raw_blend.reshape(-1, 1))[:, 1]
        else:
            probs = raw_blend
        probs = np.clip(probs, 0.0, 1.0)
        return np.column_stack([1.0 - probs, probs])

    def get_info(self) -> Dict[str, Any]:
        return {
            "alpha": round(self.alpha, 4),
            "classical_weight": round(1.0 - self.alpha, 4),
            "quantum_weight": round(self.alpha, 4),
            "is_calibrated": self.calibrator is not None,
            "is_fitted": self._fitted,
        }
