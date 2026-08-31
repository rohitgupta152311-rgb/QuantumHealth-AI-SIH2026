"""
Variational Quantum Classifier (VQC) for QuantumHealth AI.
Team Member 3 - Quantum ML Layer.

This module implements a SIMULATED VQC using PennyLane default.qubit.
No real quantum hardware is used. The quantum advantage claim is NOT made --
this demonstrates a hybrid quantum-classical workflow for research purposes.

Pipeline
--------
Input (normalized features, n_qubits values)
  -> Angle Encoding : RY(pi * x_i) on qubit i
  -> Variational layers : parameterized RY+RZ + CNOT ring entanglement
  -> Measurement : <Z_0>
  -> Sigmoid(<Z_0>) -> probability of class 1 (disease)

Training uses Nelder-Mead (scipy.optimize.minimize) for gradient-free
optimization on at most 100 training samples -- ensures < 2 min training
for the MVP.
"""

import numpy as np
import time
from pathlib import Path

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


class QuantumClassifier:
    """
    Variational Quantum Classifier using PennyLane simulation.

    This is a SIMULATED quantum classifier. It runs on pennylane default.qubit
    simulator, NOT on real quantum hardware.

    Parameters
    ----------
    n_qubits    : int   Number of qubits (= number of input features).
    n_layers    : int   Number of variational layers in the VQC circuit.
    learning_rate : float  (unused; kept for API compatibility - optimizer is Nelder-Mead)
    n_epochs    : int   Max iterations for Nelder-Mead optimizer.

    Attributes
    ----------
    params          : np.ndarray  Shape (n_layers, n_qubits, 2) - trained parameters.
    training_history: list        Loss values recorded during training (if applicable).
    """

    def __init__(
        self,
        n_qubits: int = 6,
        n_layers: int = 2,
        learning_rate: float = 0.1,
        n_epochs: int = 50,
    ):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.learning_rate = learning_rate
        self.n_epochs = n_epochs
        self.params: np.ndarray = None
        self._fitted: bool = False
        self._dev = None
        self._circuit = None
        self.encoder = AngleEncoding(n_qubits)
        self.training_history: list = []
        self._training_time: float = 0.0

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _initialize(self) -> None:
        """
        Instantiate the quantum device/circuit, and initialize parameters.
        """
        if PENNYLANE_AVAILABLE:
            try:
                self._dev = qml.device("default.qubit", wires=self.n_qubits)
                self._circuit = build_vqc_circuit(self.n_qubits, self.n_layers, self._dev)
            except Exception:
                self._circuit = build_vqc_circuit(self.n_qubits, self.n_layers)
        else:
            self._circuit = build_vqc_circuit(self.n_qubits, self.n_layers)

        # Initialize params with small random values to break symmetry
        rng = np.random.RandomState(42)
        self.params = rng.uniform(
            -np.pi / 4, np.pi / 4,
            (self.n_layers, self.n_qubits, 2)
        )

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
            x: 1-D np.ndarray of shape (n_qubits,), already normalized to [0,1].

        Returns:
            float in [0, 1] - estimated probability of class 1.
        """
        angles = self.encoder.encode(x)
        raw_output = float(self._circuit(self.params, angles))
        return self._sigmoid(raw_output)

    def _loss(self, params_flat: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
        """
        Binary cross-entropy loss over the training subset.

        Args:
            params_flat: Flattened parameter array (1-D).
            X: Feature matrix of shape (n_samples, n_qubits).
            y: Label vector of shape (n_samples,), values in {0, 1}.

        Returns:
            float: Mean binary cross-entropy loss.
        """
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
        Train the VQC using gradient-free Nelder-Mead optimization.

        For MVP performance, training is limited to at most 100 randomly
        selected samples and 50 Nelder-Mead iterations, keeping total
        training time under 2 minutes on a standard laptop.

        Args:
            X: Feature matrix of shape (n_samples, n_qubits), normalized to [0,1].
            y: Label vector of shape (n_samples,), values in {0, 1}.

        Returns:
            self (fitted QuantumClassifier).
        """
        self._initialize()
        self.training_history = []
        start = time.time()

        # Use a subset for speed (quantum simulation is slow)
        n_train = min(len(X), 100)
        rng = np.random.RandomState(0)
        indices = rng.choice(len(X), n_train, replace=False)
        X_sub = X[indices].astype(np.float64)
        y_sub = y[indices].astype(np.float64)

        params_flat = self.params.flatten()

        # Nelder-Mead is gradient-free: no circuit differentiation needed
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
                "adaptive": True,       # adaptive simplex scaling
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
            X: Feature matrix of shape (n_samples, n_qubits), normalized [0,1].

        Returns:
            np.ndarray of shape (n_samples, 2):
                column 0 = P(class=0), column 1 = P(class=1).

        Raises:
            RuntimeError: If model has not been fitted.
        """
        if not self._fitted:
            raise RuntimeError(
                "QuantumClassifier has not been fitted. Call fit() first."
            )
        probs = np.array([self._forward(x) for x in X], dtype=np.float64)
        return np.column_stack([1.0 - probs, probs])

    def predict_proba_single(self, x: np.ndarray) -> float:
        """
        Return class-1 probability for a single sample.

        If the model has not been fitted, runs the circuit with the current
        (randomly initialized) parameters as an approximation.

        Args:
            x: 1-D np.ndarray of shape (n_qubits,), normalized [0,1].

        Returns:
            float in [0, 1].
        """
        if not self._fitted:
            # Initialize with random params for a rough estimate
            self._initialize()
        return self._forward(x)

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict binary labels for a batch of samples.

        Args:
            X: Feature matrix of shape (n_samples, n_qubits).

        Returns:
            np.ndarray of shape (n_samples,) with values in {0, 1}.
        """
        probs = self.predict_proba(X)[:, 1]
        return (probs >= 0.5).astype(int)

    def get_execution_info(self) -> dict:
        """
        Return a dictionary of circuit and training metadata.

        Returns:
            dict with keys: n_qubits, n_layers, circuit_depth,
                            n_parameters, fitted, training_time_s.
        """
        info = get_circuit_info(self.n_qubits, self.n_layers)
        info["fitted"] = self._fitted
        info["training_time_s"] = round(self._training_time, 3)
        info["n_epochs"] = self.n_epochs
        info["optimizer"] = "Nelder-Mead (scipy)"
        info["max_training_samples"] = 100
        return info

    def save(self, path: str) -> None:
        """
        Persist the classifier state to disk using joblib.

        Args:
            path: File path (e.g., "models_cache/vqc_diabetes.pkl").

        Raises:
            ImportError: If joblib is not installed.
        """
        if not JOBLIB_AVAILABLE:
            raise ImportError("joblib is required for saving. pip install joblib")
        state = {
            "params": self.params,
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
            "n_epochs": self.n_epochs,
            "learning_rate": self.learning_rate,
            "_fitted": self._fitted,
            "training_history": self.training_history,
        }
        import joblib
        joblib.dump(state, path)

    def load(self, path: str) -> "QuantumClassifier":
        """
        Restore classifier state from disk.

        Args:
            path: File path written by .save().

        Returns:
            self (loaded QuantumClassifier).

        Raises:
            ImportError: If joblib is not installed.
        """
        if not JOBLIB_AVAILABLE:
            raise ImportError("joblib is required for loading. pip install joblib")
        import joblib
        state = joblib.load(path)
        self.params = state["params"]
        self.n_qubits = state["n_qubits"]
        self.n_layers = state["n_layers"]
        self.n_epochs = state["n_epochs"]
        self.learning_rate = state.get("learning_rate", 0.1)
        self._fitted = state["_fitted"]
        self.training_history = state.get("training_history", [])
        self.encoder = AngleEncoding(self.n_qubits)
        self._initialize()
        return self
