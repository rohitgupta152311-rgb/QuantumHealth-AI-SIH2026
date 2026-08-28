"""
Hybrid Quantum-Classical Model for QuantumHealth AI.
Team Member 3 - Hybrid ML Layer.

Architecture
------------
Patient Data
  -> Classical Preprocessing
  -> Feature Selection (top K features)
  -> Quantum Feature Encoding (Angle Encoding: RY rotations)
  -> VQC Circuit (PennyLane default.qubit simulator)
  -> Measurement Output (<Z_0>)
  -> Classical Decision Layer (sigmoid)
  -> Final Disease Risk Probability

This is a genuine hybrid model: the quantum circuit output is consumed
by a classical sigmoid layer for the final binary decision.

SIMULATION NOTE: All quantum circuits use PennyLane default.qubit.
No real quantum hardware is required.
"""

import numpy as np
import time

try:
    from app.quantum_ml.vqc import QuantumClassifier
    QUANTUM_AVAILABLE = True
except ImportError:
    QUANTUM_AVAILABLE = False
    QuantumClassifier = None


class HybridModel:
    """
    Hybrid Quantum-Classical Disease Risk Classifier.

    The quantum circuit (VQC) produces an expectation value that is passed
    through a sigmoid function to yield a disease probability.  Classical
    preprocessing normalizes the features before quantum encoding.

    Parameters
    ----------
    n_qubits : int  Number of qubits (= number of quantum-encoded features).
    n_layers : int  Number of variational layers in the VQC.

    Attributes
    ----------
    quantum_classifier : QuantumClassifier  The underlying VQC (fitted after .fit()).
    _fitted            : bool               Whether .fit() has been called.
    _training_time     : float              Wall-clock training time in seconds.
    """

    def __init__(self, n_qubits: int = 6, n_layers: int = 2):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.quantum_classifier: "QuantumClassifier" = None
        self._fitted: bool = False
        self._training_time: float = 0.0

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------

    def fit(self, X_quantum: np.ndarray, y: np.ndarray) -> "HybridModel":
        """
        Train the hybrid model on quantum-encoded features.

        Args:
            X_quantum: np.ndarray of shape (n_samples, n_qubits).
                       Must be pre-processed and normalized to [0, 1].
            y: np.ndarray of shape (n_samples,), binary labels {0, 1}.

        Returns:
            self (fitted HybridModel).

        Raises:
            ImportError: If PennyLane is not installed.
        """
        if not QUANTUM_AVAILABLE:
            raise ImportError(
                "PennyLane is not available. "
                "Install it with: pip install pennylane"
            )

        start = time.time()
        self.quantum_classifier = QuantumClassifier(
            n_qubits=self.n_qubits,
            n_layers=self.n_layers,
            n_epochs=50,
        )
        self.quantum_classifier.fit(X_quantum, y)
        self._training_time = time.time() - start
        self._fitted = True
        return self

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict_proba(self, X_quantum: np.ndarray) -> np.ndarray:
        """
        Return class probabilities for a batch of samples.

        Args:
            X_quantum: np.ndarray of shape (n_samples, n_qubits), normalized [0,1].

        Returns:
            np.ndarray of shape (n_samples, 2):
                column 0 = P(class=0), column 1 = P(class=1).

        Raises:
            RuntimeError: If model has not been fitted.
        """
        if not self._fitted or self.quantum_classifier is None:
            raise RuntimeError(
                "HybridModel has not been fitted. Call fit() first."
            )
        return self.quantum_classifier.predict_proba(X_quantum)

    def predict_proba_single(self, x_quantum: np.ndarray) -> float:
        """
        Return class-1 (disease) probability for a single sample.

        If the model has not been fitted, falls back to an unfitted VQC
        with random parameters (for API responsiveness during development).

        Args:
            x_quantum: 1-D np.ndarray of shape (n_qubits,), normalized [0,1].

        Returns:
            float in [0, 1] - estimated probability of disease.
        """
        if self.quantum_classifier is not None and self._fitted:
            return self.quantum_classifier.predict_proba_single(x_quantum)

        if QUANTUM_AVAILABLE:
            # Use unfitted quantum circuit as a rough approximation
            qc = QuantumClassifier(n_qubits=self.n_qubits, n_layers=self.n_layers)
            return qc.predict_proba_single(x_quantum)

        # Ultimate fallback: sigmoid of weighted sum
        weights = np.ones(len(x_quantum)) * 0.3
        return float(1.0 / (1.0 + np.exp(-np.dot(x_quantum, weights))))

    def predict(self, X_quantum: np.ndarray) -> np.ndarray:
        """
        Predict binary labels for a batch of samples.

        Args:
            X_quantum: np.ndarray of shape (n_samples, n_qubits).

        Returns:
            np.ndarray of shape (n_samples,) with values in {0, 1}.
        """
        probs = self.predict_proba(X_quantum)[:, 1]
        return (probs >= 0.5).astype(int)

    # ------------------------------------------------------------------
    # Properties and persistence
    # ------------------------------------------------------------------

    @property
    def training_time(self) -> float:
        """Wall-clock training time in seconds."""
        return self._training_time

    def save(self, path: str) -> None:
        """
        Persist the model to disk.

        Args:
            path: File path for the saved model (e.g., models_cache/hybrid.pkl).
        """
        if self.quantum_classifier is not None:
            self.quantum_classifier.save(path)

    def load(self, path: str) -> None:
        """
        Restore the model from disk.

        Args:
            path: File path written by .save().
        """
        if QUANTUM_AVAILABLE:
            self.quantum_classifier = QuantumClassifier(
                n_qubits=self.n_qubits,
                n_layers=self.n_layers,
            )
            self.quantum_classifier.load(path)
            self._fitted = True

    def get_info(self) -> dict:
        """Return metadata about this hybrid model."""
        return {
            "model_type": "HybridQuantumClassical",
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
            "fitted": self._fitted,
            "training_time_s": round(self._training_time, 3),
            "backend": "pennylane:default.qubit (simulator)",
            "simulation_mode": True,
            "quantum_available": QUANTUM_AVAILABLE,
        }
