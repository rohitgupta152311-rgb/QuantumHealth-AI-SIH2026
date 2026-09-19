"""
Variational Quantum Classifier (VQC) for QuantumHealth AI.
Team Member 3 - Quantum ML Layer.

This module implements a SIMULATED VQC using PennyLane default.qubit or native NumPy statevector simulation.
No real quantum hardware is used. The quantum advantage claim is NOT made --
this demonstrates a hybrid quantum-classical workflow for research purposes.

Pipeline
--------
Input (MinMax-normalized features in [0, 1], n_qubits values)
  -> Angle Encoding : RY(pi * x_i) on qubit i
  -> Variational layers : parameterized RY+RZ + CNOT ring entanglement
  -> Measurement : Pauli-Z expectation <Z_0> in [-1, 1]
  -> Born rule measurement projection: P(class 1) = (1 - <Z_0>) / 2 in [0, 1]
  -> Optional Platt Scaling Calibrator fitted on validation split
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
from app.quantum_ml.circuits import build_vqc_circuit, get_circuit_info, compute_circuit_depth
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
    backend               : str   'numpy:statevector' (default) or 'pennylane:default.qubit'.
    """

    def __init__(
        self,
        n_qubits: int = 6,
        n_layers: int = 2,
        learning_rate: float = 0.1,
        n_epochs: int | None = None,
        max_training_samples: int | None = None,
        backend: str = "numpy:statevector",
        optimizer: str = "cobyla",
        data_reuploading: bool = True,
        loss_fn: str = "bce",
    ):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.learning_rate = learning_rate
        self.n_epochs = n_epochs if n_epochs is not None else getattr(settings, "quantum_vqc_epochs", 200)
        self.max_training_samples = (
            max_training_samples
            if max_training_samples is not None
            else getattr(settings, "quantum_max_train_samples", 300)
        )
        self.backend = backend
        self.optimizer = optimizer
        self.data_reuploading = data_reuploading
        self.loss_fn = loss_fn
        self.params: np.ndarray = None
        self._fitted: bool = False
        self._circuit = None
        self.encoder = AngleEncoding(n_qubits)
        self.training_history: list = []
        self._training_time: float = 0.0
        self.calibrator = None
        self.calibration_transform = "born_probability"

    # ------------------------------------------------------------------
    # Internal helpers: decoupled circuit building vs parameter init
    # ------------------------------------------------------------------

    def _build_circuit(self) -> None:
        """Instantiate the simulation circuit matching self.backend."""
        self._circuit = build_vqc_circuit(self.n_qubits, self.n_layers, backend=self.backend)

    def _init_params(self, force: bool = False, seed: int = 42) -> None:
        """Initialize random trainable parameters if not already present."""
        if self.params is None or force:
            rng = np.random.RandomState(seed)
            params = np.zeros((self.n_layers, self.n_qubits, 2))
            for l in range(self.n_layers):
                bound = np.pi / (2 * (l + 1))
                params[l] = rng.uniform(-bound, bound, (self.n_qubits, 2))
            self.params = params

    def _initialize(self) -> None:
        """Rebuild circuit and initialize params if absent."""
        self._build_circuit()
        self._init_params()

    def _reuploading_forward(self, angles: np.ndarray) -> float:
        """Data re-uploading forward pass: re-encode data before each variational layer."""
        from app.quantum_ml.circuits import _ry, _rz, _apply_1q_gate, _apply_cnot

        n = self.n_qubits
        dim = 1 << n
        state = np.zeros(dim, dtype=complex)
        state[0] = 1.0

        for l in range(self.n_layers):
            # Re-encode data at each layer
            for i in range(n):
                angle = float(angles[i]) if i < len(angles) else 0.0
                state = _apply_1q_gate(state, _ry(angle), i, n)

            # Variational rotations
            for i in range(n):
                theta = float(self.params[l, i, 0])
                phi = float(self.params[l, i, 1])
                state = _apply_1q_gate(state, _ry(theta), i, n)
                state = _apply_1q_gate(state, _rz(phi), i, n)

            # CNOT ring entanglement
            for i in range(n - 1):
                state = _apply_cnot(state, i, i + 1, n)
            if n > 1:
                state = _apply_cnot(state, n - 1, 0, n)

        # Measurement: <Z_0>
        expval = 0.0
        for idx in range(dim):
            prob = float(np.abs(state[idx]) ** 2)
            bit0 = (idx >> (n - 1)) & 1
            sign = 1.0 if bit0 == 0 else -1.0
            expval += sign * prob

        return float(expval)

    def _forward(self, x: np.ndarray, backend: str | None = None) -> float:
        """
        Run the VQC circuit for a single sample and return class-1 Born probability.

        P(1) = (1.0 - <Z_0>) / 2.0 in [0, 1].

        Args:
            x: 1-D np.ndarray of shape (n_qubits,), already normalized in [0, 1].
            backend: Optional quantum simulator backend override.

        Returns:
            float in [0, 1] - estimated Born probability of class 1.
        """
        if self.params is None:
            raise RuntimeError("QuantumClassifier parameters are uninitialized.")

        angles = self.encoder.encode(x)
        active_backend = backend or self.backend

        if active_backend and active_backend not in ("numpy", "numpy:statevector"):
            try:
                from app.quantum_ml.circuits import build_vqc_circuit
                circuit_fn = build_vqc_circuit(self.n_qubits, self.n_layers, backend=active_backend)
                raw_output = float(circuit_fn(self.params, angles))
            except Exception:
                raw_output = self._reuploading_forward(angles)
        elif self.data_reuploading:
            raw_output = self._reuploading_forward(angles)
        else:
            if self._circuit is None:
                self._build_circuit()
            raw_output = float(self._circuit(self.params, angles))

        # Exact Born measurement projection for Pauli-Z expectation in [-1, 1]
        born_prob = (1.0 - raw_output) / 2.0
        return float(np.clip(born_prob, 0.0, 1.0))

    def _loss(self, params_flat: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
        """Binary cross-entropy or focal loss over the training subset using Born probabilities."""
        self.params = params_flat.reshape(self.n_layers, self.n_qubits, 2)
        total_loss = 0.0
        alpha = 0.75
        gamma = 2.0
        for xi, yi in zip(X, y):
            prob = self._forward(xi)
            prob = np.clip(prob, 1e-7, 1.0 - 1e-7)
            if self.loss_fn == "focal":
                if yi == 1:
                    total_loss += -alpha * ((1.0 - prob) ** gamma) * np.log(prob)
                else:
                    total_loss += -(1.0 - alpha) * (prob ** gamma) * np.log(1.0 - prob)
            else:
                total_loss -= yi * np.log(prob) + (1.0 - yi) * np.log(1.0 - prob)
        loss = total_loss / len(X)
        self.training_history.append(float(loss))
        return loss

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fit(self, X: np.ndarray, y: np.ndarray) -> "QuantumClassifier":
        """
        Train the VQC using deterministic stratified sub-sampling and multi-start optimization.

        Args:
            X: Feature matrix of shape (n_samples, n_qubits), strictly in [0, 1].
            y: Label vector of shape (n_samples,), values in {0, 1}.

        Returns:
            self (fitted QuantumClassifier).
        """
        self._initialize()
        self.training_history = []
        start = time.time()

        # Case-control real clinical subset selection (prevents 0-event slices on imbalanced cohorts)
        pos_idx = np.where(y == 1)[0]
        neg_idx = np.where(y == 0)[0]
        
        if len(pos_idx) > 0 and len(neg_idx) > 0 and len(X) > self.max_training_samples:
            rng = np.random.RandomState(42)
            n_pos = min(len(pos_idx), self.max_training_samples // 2)
            n_neg = min(len(neg_idx), self.max_training_samples - n_pos)
            pos_sample = rng.choice(pos_idx, size=n_pos, replace=False)
            neg_sample = rng.choice(neg_idx, size=n_neg, replace=False)
            sub_idx = np.concatenate([pos_sample, neg_sample])
            rng.shuffle(sub_idx)
            X_sub = X[sub_idx].astype(np.float64)
            y_sub = y[sub_idx].astype(np.float64)
        elif len(X) > self.max_training_samples:
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

        from scipy.optimize import minimize
        
        n_starts = 3 if self.n_epochs >= 100 else 1
        best_loss = float('inf')
        best_params = None
        
        for start_idx in range(n_starts):
            self._init_params(force=True, seed=42 + start_idx)
            params_flat = self.params.flatten()
            
            opts = {"maxiter": self.n_epochs}
            if self.optimizer.lower() == "nelder-mead":
                opts.update({"xatol": 1e-3, "fatol": 1e-3, "adaptive": True})
                
            method = "COBYLA" if self.optimizer.lower() == "cobyla" else \
                     "Powell" if self.optimizer.lower() == "powell" else "Nelder-Mead"

            result = minimize(
                self._loss,
                params_flat,
                args=(X_sub, y_sub),
                method=method,
                options=opts,
            )
            
            final_loss = self._loss(result.x, X_sub, y_sub)
            if final_loss < best_loss:
                best_loss = final_loss
                best_params = result.x.copy()

        self.params = best_params.reshape(self.n_layers, self.n_qubits, 2)
        self._fitted = True
        self._training_time = time.time() - start
        return self

    def fit_calibrator(self, X_val: np.ndarray, y_val: np.ndarray) -> "QuantumClassifier":
        """
        Fit Platt probability calibrator on unaugmented validation data using raw Born probabilities.
        """
        if not self._fitted or self.params is None:
            raise RuntimeError("Cannot fit calibrator on an unfitted QuantumClassifier.")
        from sklearn.linear_model import LogisticRegression
        raw_probs = np.array([self._forward(x) for x in X_val]).reshape(-1, 1)
        self.calibrator = LogisticRegression(C=1.0, solver="lbfgs")
        self.calibrator.fit(raw_probs, y_val)
        return self

    def predict_proba(self, X: np.ndarray, calibrated: bool = True) -> np.ndarray:
        """
        Return class probabilities for a batch of samples.

        Args:
            X: Feature matrix of shape (n_samples, n_qubits), strictly in [0, 1].
            calibrated: Whether to apply Platt calibrator if available.

        Returns:
            np.ndarray of shape (n_samples, 2):
                column 0 = P(class=0), column 1 = P(class=1).
        """
        if not self._fitted or self.params is None:
            raise RuntimeError(
                "QuantumClassifier has not been fitted. Call fit() or load() first."
            )
        raw_probs = np.array([self._forward(x) for x in X], dtype=np.float64)

        if calibrated and self.calibrator is not None:
            probs = self.calibrator.predict_proba(raw_probs.reshape(-1, 1))[:, 1]
        else:
            probs = raw_probs

        probs = np.clip(probs, 0.0, 1.0)
        return np.column_stack([1.0 - probs, probs])

    def predict_proba_single(self, x: np.ndarray, calibrated: bool = True, backend: str | None = None) -> float:
        """Return class-1 probability for a single sample on the specified backend."""
        if not self._fitted or self.params is None:
            raise RuntimeError(
                "QuantumClassifier has not been fitted. Call fit() or load() first."
            )
        raw_prob = self._forward(x, backend=backend)
        if calibrated and self.calibrator is not None:
            cal_prob = float(self.calibrator.predict_proba([[raw_prob]])[0, 1])
            return float(np.clip(cal_prob, 0.0, 1.0))
        return raw_prob

    def predict(self, X: np.ndarray, calibrated: bool = True) -> np.ndarray:
        """Predict binary labels for a batch of samples."""
        probs = self.predict_proba(X, calibrated=calibrated)[:, 1]
        return (probs >= 0.5).astype(int)

    def get_execution_info(self) -> dict:
        """Return a dictionary of circuit and training metadata."""
        info = get_circuit_info(self.n_qubits, self.n_layers, backend=self.backend)
        info["fitted"] = self._fitted
        info["training_time_s"] = round(self._training_time, 3)
        info["n_epochs"] = self.n_epochs
        info["optimizer"] = self.optimizer
        info["max_training_samples"] = self.max_training_samples
        info["is_calibrated"] = self.calibrator is not None
        info["calibration_transform"] = self.calibration_transform
        info["data_reuploading"] = self.data_reuploading
        info["loss_fn"] = self.loss_fn
        info["multi_start"] = 3 if self.n_epochs >= 100 else 1
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
            "backend": self.backend,
            "optimizer": self.optimizer,
            "data_reuploading": self.data_reuploading,
            "loss_fn": self.loss_fn,
            "_fitted": self._fitted,
            "training_history": self.training_history,
            "_training_time": self._training_time,
            "calibrator": self.calibrator,
            "calibration_transform": self.calibration_transform,
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
        self.n_epochs = state.get("n_epochs", 200)
        self.max_training_samples = state.get("max_training_samples", 300)
        self.learning_rate = state.get("learning_rate", 0.1)
        self.backend = state.get("backend", "numpy:statevector")
        self.optimizer = state.get("optimizer", "cobyla")
        self.data_reuploading = state.get("data_reuploading", True)
        self.loss_fn = state.get("loss_fn", "bce")
        self._fitted = state.get("_fitted", True)
        self.training_history = state.get("training_history", [])
        self._training_time = state.get("_training_time", 0.0)
        self.calibrator = state.get("calibrator", None)
        self.calibration_transform = state.get("calibration_transform", "born_probability")
        self.encoder = AngleEncoding(self.n_qubits)
        # Rebuild circuit/device ONLY - do NOT overwrite self.params
        self._build_circuit()
        return self

    def __getstate__(self) -> dict:
        """Exclude unpickleable circuit closure and device from serialized state."""
        state = self.__dict__.copy()
        state["_circuit"] = None
        return state

    def __setstate__(self, state: dict) -> None:
        """Restore state and prepare for lazy circuit rebuilding."""
        self.__dict__.update(state)
        self._circuit = None

