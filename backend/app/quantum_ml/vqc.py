"""
Variational Quantum Classifier (VQC) for QuantumHealth AI.
Team Member 3 - Quantum ML Layer.

This module implements a SIMULATED VQC using PennyLane default.qubit / native NumPy simulation.
No real quantum hardware is used. The quantum advantage claim is NOT made --
this demonstrates a hybrid quantum-classical workflow for research purposes.

Pipeline
--------
Input (MinMax-normalized features in [0, 1], n_qubits values)
  -> Angle Encoding : RY(pi * x_i) on qubit i
  -> Variational layers : parameterized RY+RZ + CNOT ring entanglement
  -> Measurement : <Z_0>
  -> Sigmoid(<Z_0>) -> probability of class 1 (disease)
"""

import os
import time
from pathlib import Path
import numpy as np

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

try:
    import pennylane as qml
    PENNYLANE_AVAILABLE = True
except ImportError:
    PENNYLANE_AVAILABLE = False

from app.quantum_ml.encoding import AngleEncoding
from app.quantum_ml.circuits import build_vqc_circuit, get_circuit_info
from app.core.config import settings


class QuantumClassifier:
    """
    Variational Quantum Classifier using Quantum Simulation.

    Parameters
    ----------
    n_qubits              : int   Number of qubits (= number of input features).
    n_layers              : int   Number of variational layers in the VQC circuit.
    learning_rate         : float (kept for API compatibility)
    n_epochs              : int   Max iterations for Nelder-Mead optimizer (default: 150).
    max_training_samples  : int   Max samples for quantum training subset (default: 200).
    """

    def __init__(
        self,
        n_qubits: int = 6,
        n_layers: int = 2,
        learning_rate: float = 0.1,
        n_epochs: int | None = None,
        max_training_samples: int | None = None,
    ):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.learning_rate = learning_rate
        self.n_epochs = n_epochs if n_epochs is not None else getattr(settings, "quantum_vqc_epochs", 150)
        self.max_training_samples = (
            max_training_samples
            if max_training_samples is not None
            else getattr(settings, "quantum_max_train_samples", 200)
        )
        self.params: np.ndarray = None
        self._fitted: bool = False
        self._dev = None
        self._circuit = None
        self.encoder = AngleEncoding(n_qubits)
        self.training_history: list = []
        self._training_time: float = 0.0

    # ------------------------------------------------------------------
    # Internal helpers: decoupled circuit building vs parameter init
    # ------------------------------------------------------------------

    def _build_circuit(self) -> None:
        """Instantiate the simulator device and QNode circuit without altering params."""
        if PENNYLANE_AVAILABLE:
            try:
                self._dev = qml.device("default.qubit", wires=self.n_qubits)
                self._circuit = build_vqc_circuit(self.n_qubits, self.n_layers, self._dev)
            except Exception:
                self._circuit = build_vqc_circuit(self.n_qubits, self.n_layers)
        else:
            self._circuit = build_vqc_circuit(self.n_qubits, self.n_layers)

    def _init_params(self, force: bool = False) -> None:
        """Initialize random trainable parameters if not already present."""
        if self.params is None or force:
            rng = np.random.RandomState(42)
            self.params = rng.uniform(
                -np.pi / 4, np.pi / 4,
                (self.n_layers, self.n_qubits, 2)
            )

    def _initialize(self) -> None:
        """Rebuild circuit and initialize params if absent."""
        self._build_circuit()
        self._init_params()

    @staticmethod
    def _sigmoid(x: float) -> float:
        """Numerically stable sigmoid function."""
        if x >= 0:
            return 1.0 / (1.0 + np.exp(-x))
        else:
            ex = np.exp(x)
            return ex / (1.0 + ex)

    def _forward(self, x: np.ndarray) -> float:
        """
        Run the VQC circuit for a single sample and return class-1 probability.

        Args:
            x: 1-D np.ndarray of shape (n_qubits,), already in [0, 1].

        Returns:
            float in [0, 1] - estimated probability of class 1.
        """
        if self._circuit is None:
            self._build_circuit()
        if self.params is None:
            self._init_params()

        angles = self.encoder.encode(x)
        raw_output = float(self._circuit(self.params, angles))
        return self._sigmoid(raw_output)

    def _loss(self, params_flat: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
        """Binary cross-entropy loss over the training subset."""
        self.params = params_flat.reshape(self.n_layers, self.n_qubits, 2)
        total_loss = 0.0
        for xi, yi in zip(X, y):
            prob = self._forward(xi)
            prob = np.clip(prob, 1e-7, 1.0 - 1e-7)
            total_loss -= yi * np.log(prob) + (1.0 - yi) * np.log(1.0 - prob)
        loss = total_loss / len(X)
        self.training_history.append(float(loss))
        return loss

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fit(self, X: np.ndarray, y: np.ndarray) -> "QuantumClassifier":
        """
        Train the VQC using deterministic stratified sub-sampling and Nelder-Mead optimization.

        Args:
            X: Feature matrix of shape (n_samples, n_qubits), strictly in [0, 1].
            y: Label vector of shape (n_samples,), values in {0, 1}.

        Returns:
            self (fitted QuantumClassifier).
        """
        self._initialize()
        self.training_history = []
        start = time.time()

        # Deterministic, stratified sample selection
        if len(X) > self.max_training_samples:
            from sklearn.model_selection import StratifiedShuffleSplit
            sss = StratifiedShuffleSplit(
                n_splits=1,
                train_size=self.max_training_samples,
                random_state=42,
            )
            sub_idx, _ = next(sss.split(X, y))
            X_sub = X[sub_idx].astype(np.float64)
            y_sub = y[sub_idx].astype(np.float64)
        else:
            X_sub = X.astype(np.float64)
            y_sub = y.astype(np.float64)

        params_flat = self.params.flatten()

        from scipy.optimize import minimize

        result = minimize(
            self._loss,
            params_flat,
            args=(X_sub, y_sub),
            method="Nelder-Mead",
            options={
                "maxiter": self.n_epochs,
                "xatol": 1e-3,
                "fatol": 1e-3,
                "adaptive": True,
            },
        )

        self.params = result.x.reshape(self.n_layers, self.n_qubits, 2)
        self._fitted = True
        self._training_time = time.time() - start
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Return class probabilities for a batch of samples.

        Args:
            X: Feature matrix of shape (n_samples, n_qubits), strictly in [0, 1].

        Returns:
            np.ndarray of shape (n_samples, 2):
                column 0 = P(class=0), column 1 = P(class=1).
        """
        if not self._fitted and self.params is None:
            raise RuntimeError(
                "QuantumClassifier has not been fitted. Call fit() or load() first."
            )
        probs = np.array([self._forward(x) for x in X], dtype=np.float64)
        return np.column_stack([1.0 - probs, probs])

    def predict_proba_single(self, x: np.ndarray) -> float:
        """Return class-1 probability for a single sample."""
        if not self._fitted and self.params is None:
            self._initialize()
        return self._forward(x)

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict binary labels for a batch of samples."""
        probs = self.predict_proba(X)[:, 1]
        return (probs >= 0.5).astype(int)

    def get_execution_info(self) -> dict:
        """Return a dictionary of circuit and training metadata."""
        info = get_circuit_info(self.n_qubits, self.n_layers)
        info["fitted"] = self._fitted
        info["training_time_s"] = round(self._training_time, 3)
        info["n_epochs"] = self.n_epochs
        info["optimizer"] = "Nelder-Mead (scipy)"
        info["max_training_samples"] = self.max_training_samples
        return info

    def save(self, path: str | Path) -> None:
        """Persist the trained classifier state to disk."""
        if not JOBLIB_AVAILABLE:
            raise ImportError("joblib is required for saving.")
        os.makedirs(os.path.dirname(str(path)) or ".", exist_ok=True)
        state = {
            "params": self.params,
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
            "n_epochs": self.n_epochs,
            "max_training_samples": self.max_training_samples,
            "learning_rate": self.learning_rate,
            "_fitted": self._fitted,
            "training_history": self.training_history,
            "_training_time": self._training_time,
        }
        joblib.dump(state, str(path))

    def load(self, path: str | Path) -> "QuantumClassifier":
        """
        Restore classifier state from disk preserving trained parameters.
        """
        if not JOBLIB_AVAILABLE:
            raise ImportError("joblib is required for loading.")
        state = joblib.load(str(path))
        self.params = np.array(state["params"], copy=True)
        self.n_qubits = state["n_qubits"]
        self.n_layers = state["n_layers"]
        self.n_epochs = state.get("n_epochs", 150)
        self.max_training_samples = state.get("max_training_samples", 200)
        self.learning_rate = state.get("learning_rate", 0.1)
        self._fitted = state.get("_fitted", True)
        self.training_history = state.get("training_history", [])
        self._training_time = state.get("_training_time", 0.0)
        self.encoder = AngleEncoding(self.n_qubits)
        # Rebuild circuit/device ONLY - do NOT overwrite self.params
        self._build_circuit()
        return self
