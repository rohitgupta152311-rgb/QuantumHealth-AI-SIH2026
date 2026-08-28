"""
Full Hybrid Quantum-Classical Pipeline for QuantumHealth AI.
Team Member 3 - Hybrid ML Layer.

Orchestrates the complete prediction pipeline:

  Raw Patient Data
    -> Classical Preprocessing (normalization, feature selection)
    -> Quantum Feature Encoding (Angle Encoding)
    -> VQC Circuit (PennyLane default.qubit SIMULATOR)
    -> Measurement + Sigmoid
    -> Hybrid Probability (weighted average with classical models)
    -> Consensus Engine
    -> Final Risk Assessment

SIMULATION: All quantum computation uses pennylane:default.qubit.
No real quantum hardware is used or required.
"""

import numpy as np
import time
from pathlib import Path

try:
    from app.quantum_ml.vqc import QuantumClassifier, PENNYLANE_AVAILABLE
    from app.hybrid_ml.hybrid_model import HybridModel
    from app.hybrid_ml.consensus import ConsensusEngine
    from app.quantum_ml.readiness import QuantumReadinessAnalyzer
    from app.quantum_ml.circuits import get_circuit_info, get_feature_to_qubit_map
    _IMPORTS_OK = True
except ImportError as e:
    PENNYLANE_AVAILABLE = False
    _IMPORTS_OK = False


def risk_level_from_probability(prob: float) -> str:
    """
    Map a probability to a categorical risk level.

    Args:
        prob: float in [0, 1].

    Returns:
        One of: "very_low", "low", "moderate", "high", "very_high".
    """
    if prob < 0.20:
        return "very_low"
    elif prob < 0.40:
        return "low"
    elif prob < 0.60:
        return "moderate"
    elif prob < 0.80:
        return "high"
    else:
        return "very_high"


class HybridPipeline:
    """
    Manages training and inference for the hybrid quantum-classical pipeline.

    Parameters
    ----------
    disease_id : str   Identifier for the disease being modelled (e.g., "diabetes").
    n_qubits   : int   Number of qubits = number of quantum-encoded features.
    n_layers   : int   Number of variational layers in the VQC.
    cache_dir  : Path  Directory for saving / loading trained models.

    Usage
    -----
    pipeline = HybridPipeline(disease_id="diabetes", n_qubits=6)
    pipeline.fit(X_quantum, y)
    result = pipeline.predict_quantum(x_single, selected_feats, original_feats)
    """

    def __init__(
        self,
        disease_id: str,
        n_qubits: int = 6,
        n_layers: int = 2,
        cache_dir: Path = None,
    ):
        self.disease_id    = disease_id
        self.n_qubits      = n_qubits
        self.n_layers      = n_layers
        self.cache_dir     = cache_dir or Path("models_cache")
        self._fitted       = False
        self._training_time = 0.0

        # Sub-components
        self.hybrid_model      = HybridModel(n_qubits=n_qubits, n_layers=n_layers) if _IMPORTS_OK else None
        self.consensus_engine  = ConsensusEngine() if _IMPORTS_OK else None
        self.readiness_analyzer = QuantumReadinessAnalyzer(n_layers=n_layers) if _IMPORTS_OK else None

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------

    def fit(self, X_quantum: np.ndarray, y: np.ndarray) -> "HybridPipeline":
        """
        Train the hybrid model.

        Args:
            X_quantum: np.ndarray shape (n_samples, n_qubits), normalized [0,1].
            y        : np.ndarray shape (n_samples,), binary labels {0, 1}.

        Returns:
            self (fitted HybridPipeline).
        """
        start = time.time()
        self.hybrid_model.fit(X_quantum, y)
        self._training_time = time.time() - start
        self._fitted = True
        return self

    # ------------------------------------------------------------------
    # Quantum Inference
    # ------------------------------------------------------------------

    def predict_quantum(
        self,
        x_quantum: np.ndarray,
        selected_feature_names: list,
        original_feature_names: list,
    ) -> dict:
        """
        Run quantum prediction on a single patient sample.

        Args:
            x_quantum             : 1-D np.ndarray of shape (n_qubits,), normalized [0,1].
            selected_feature_names: Feature names used for quantum encoding.
            original_feature_names: All feature names in the original dataset.

        Returns:
            dict matching the QuantumResult API schema:
                {
                    "backend"          : str,
                    "qubits_used"      : int,
                    "circuit_depth"    : int,
                    "encoding"         : str,
                    "risk_probability" : float,
                    "prediction"       : "high_risk" | "low_risk",
                    "simulation_mode"  : True,
                    "execution_time_ms": float,
                }
        """
        start = time.time()

        try:
            prob = self.hybrid_model.predict_proba_single(x_quantum)
            backend = "pennylane:default.qubit"
            circuit_info = get_circuit_info(self.n_qubits, self.n_layers)
        except Exception:
            # Fallback: sigmoid of a simple weighted sum
            weights = np.ones(len(x_quantum)) * 0.3
            prob = float(1.0 / (1.0 + np.exp(-np.dot(x_quantum, weights))))
            backend = "pennylane:default.qubit (fallback)"
            circuit_info = {
                "circuit_depth": 1 + self.n_layers * (1 + self.n_qubits) + 1,
                "n_parameters":  self.n_qubits * self.n_layers * 2,
                "gates_used":    ["RY", "RZ", "CNOT"],
            }

        execution_time = (time.time() - start) * 1000.0
        prediction = "high_risk" if prob >= 0.5 else "low_risk"

        return {
            "backend":           backend,
            "qubits_used":       self.n_qubits,
            "circuit_depth":     circuit_info.get("circuit_depth", 10),
            "encoding":          "Angle Encoding",
            "risk_probability":  round(float(prob), 6),
            "prediction":        prediction,
            "simulation_mode":   True,
            "execution_time_ms": round(execution_time, 2),
        }

    # ------------------------------------------------------------------
    # Hybrid Combination
    # ------------------------------------------------------------------

    def get_hybrid_result(
        self,
        classical_probs: list,
        quantum_prob: float,
        weights: tuple = (0.6, 0.4),   # (classical_weight, quantum_weight)
    ) -> dict:
        """
        Combine classical and quantum probabilities into a single hybrid result.

        Args:
            classical_probs: List of class-1 probabilities from classical models.
            quantum_prob   : Class-1 probability from the quantum VQC.
            weights        : (classical_weight, quantum_weight) tuple, must sum to 1.

        Returns:
            dict with keys:
                risk_probability, risk_percentage, prediction,
                confidence, risk_level.
        """
        classical_avg = float(np.mean(classical_probs))
        hybrid_prob   = weights[0] * classical_avg + weights[1] * float(quantum_prob)
        hybrid_prob   = float(np.clip(hybrid_prob, 0.0, 1.0))

        prediction  = "high_risk" if hybrid_prob >= 0.5 else "low_risk"
        risk_level  = risk_level_from_probability(hybrid_prob)

        # Confidence: distance from the 0.5 decision boundary, scaled to [0, 1]
        confidence = abs(hybrid_prob - 0.5) * 2.0

        return {
            "risk_probability":  round(hybrid_prob, 6),
            "risk_percentage":   round(hybrid_prob * 100, 1),
            "prediction":        prediction,
            "confidence":        round(confidence, 4),
            "risk_level":        risk_level,
            "classical_avg":     round(classical_avg, 6),
            "quantum_prob":      round(float(quantum_prob), 6),
            "weights":           {"classical": weights[0], "quantum": weights[1]},
        }

    # ------------------------------------------------------------------
    # Readiness and Circuit Info
    # ------------------------------------------------------------------

    def get_quantum_readiness(
        self,
        original_feature_names: list,
        selected_feature_names: list,
    ) -> dict:
        """
        Return quantum readiness metrics for this feature selection.

        Args:
            original_feature_names: All dataset feature names.
            selected_feature_names: Features chosen for quantum encoding.

        Returns:
            Quantum readiness dict from QuantumReadinessAnalyzer.
        """
        if self.readiness_analyzer is None:
            return {"error": "Readiness analyzer not available (import error)."}
        return self.readiness_analyzer.analyze(
            original_feature_names=original_feature_names,
            selected_feature_names=selected_feature_names,
        )

    def get_circuit_info_dict(self, selected_feature_names: list) -> dict:
        """
        Return the full QuantumCircuitInfo dict for API responses.

        Args:
            selected_feature_names: Ordered list of feature names (index = qubit).

        Returns:
            dict with circuit metadata, feature-to-qubit map, and ASCII diagram.
        """
        info = get_circuit_info(self.n_qubits, self.n_layers)
        info["disease"]              = self.disease_id
        info["feature_to_qubit_map"] = get_feature_to_qubit_map(selected_feature_names)
        info["circuit_ascii"]        = self._generate_circuit_ascii(selected_feature_names)
        return info

    def _generate_circuit_ascii(self, feature_names: list) -> str:
        """
        Generate a text representation of the quantum circuit for display.

        Args:
            feature_names: Ordered list of feature names used in the circuit.

        Returns:
            Multi-line ASCII art string.
        """
        lines = [
            "=== Quantum Circuit (Simulation Mode: pennylane:default.qubit) ===",
            "",
        ]
        for i, feat in enumerate(feature_names):
            short = feat[:10].ljust(10)
            line = (
                f"  q{i}|0> -[RY(pi*{short})]-"
                f"[RY(th)][RZ(ph)]-@- <Z>"
            )
            lines.append(line)
        lines += [
            "",
            f"  Backend   : PennyLane default.qubit (Simulator)",
            f"  Layers    : {self.n_layers}",
            f"  Qubits    : {self.n_qubits}",
            f"  Parameters: {self.n_qubits * self.n_layers * 2}",
            f"  Encoding  : Angle Encoding (RY rotations)",
            f"  Simulation: True",
        ]
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: str) -> None:
        """
        Save the trained hybrid model to disk.

        Args:
            path: File path (e.g., "models_cache/hybrid_diabetes.pkl").
        """
        if self.hybrid_model is not None:
            self.hybrid_model.save(path)

    def load(self, path: str) -> None:
        """
        Load a previously saved hybrid model from disk.

        Args:
            path: File path written by .save().
        """
        if self.hybrid_model is not None:
            self.hybrid_model.load(path)
            self._fitted = True

    def get_info(self) -> dict:
        """Return pipeline metadata dict."""
        return {
            "disease_id":        self.disease_id,
            "n_qubits":          self.n_qubits,
            "n_layers":          self.n_layers,
            "fitted":            self._fitted,
            "training_time_s":   round(self._training_time, 3),
            "backend":           "pennylane:default.qubit (simulator)",
            "simulation_mode":   True,
            "pennylane_available": PENNYLANE_AVAILABLE,
        }
