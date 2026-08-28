"""
Quantum Readiness Analyzer for QuantumHealth AI.
Team Member 3 - Quantum ML Layer.

Analyzes a dataset / feature selection and reports how suitable it is
for the quantum simulation pipeline. This is a unique, user-facing
feature of QuantumHealth AI providing transparency about the encoding.

All analysis is for SIMULATED quantum circuits (pennylane:default.qubit).
"""

import numpy as np


class QuantumReadinessAnalyzer:
    """
    Analyzes a dataset or feature selection and reports quantum readiness metrics.

    Example output
    --------------
    {
        "original_features": 30,
        "selected_features": 6,
        "qubits_required": 6,
        "dimensionality_reduction_ratio": 0.80,
        "encoding_method": "Angle Encoding (RY rotations, pi x normalized_feature)",
        "circuit_depth": 15,
        "layers": 2,
        "backend": "pennylane:default.qubit (Quantum Simulator)",
        "simulation_status": "simulated",
        "feature_to_qubit_map": {"Glucose": 0, "BMI": 1, ...},
        "readiness": {"score": "excellent", "explanation": "..."},
        "n_parameters": 24,
    }
    """

    def __init__(self, n_layers: int = 2):
        """
        Initialize the analyzer.

        Args:
            n_layers: Number of variational layers in the VQC circuit.
        """
        self.n_layers = n_layers

    def analyze(
        self,
        original_feature_names: list,
        selected_feature_names: list,
        backend: str = "pennylane:default.qubit",
    ) -> dict:
        """
        Compute full quantum readiness metrics for a feature selection.

        Args:
            original_feature_names: All feature names in the raw dataset.
            selected_feature_names: Features chosen for quantum encoding
                                    (length = number of qubits).
            backend: PennyLane backend string (informational only).

        Returns:
            A dict with readiness metrics, suitable for the API response.
        """
        n_orig = len(original_feature_names)
        n_sel  = len(selected_feature_names)
        n_qubits = n_sel

        # circuit_depth = encoding layer + (rotation + entanglement) * n_layers + measurement
        circuit_depth = 1 + self.n_layers * (1 + n_qubits) + 1

        # Dimensionality reduction ratio (how much we compressed)
        reduction_ratio = 1.0 - (n_sel / n_orig) if n_orig > 0 else 0.0

        # Total trainable parameters: RY + RZ per qubit per layer
        n_parameters = self.n_layers * n_qubits * 2

        feature_to_qubit_map = {
            feat: i for i, feat in enumerate(selected_feature_names)
        }

        readiness = self.get_readiness_score(n_orig, n_sel)

        return {
            "original_features":              n_orig,
            "selected_features":              n_sel,
            "qubits_required":                n_qubits,
            "dimensionality_reduction_ratio": round(reduction_ratio, 4),
            "encoding_method":                "Angle Encoding (RY rotations, pi x normalized_feature)",
            "circuit_depth":                  circuit_depth,
            "layers":                         self.n_layers,
            "n_parameters":                   n_parameters,
            "backend":                        f"{backend} (Quantum Simulator)",
            "simulation_status":              "simulated",
            "feature_to_qubit_map":           feature_to_qubit_map,
            "readiness":                      readiness,
        }

    def get_readiness_score(self, n_original: int, n_selected: int) -> dict:
        """
        Rate how ready the data is for quantum processing based on qubit count.

        Args:
            n_original: Total number of original features.
            n_selected: Number of features selected for quantum encoding.

        Returns:
            dict with keys 'score', 'explanation', 'recommended_max_qubits'.
        """
        if n_selected <= 8:
            score = "excellent"
            explanation = (
                "Data is well-suited for near-term quantum circuits. "
                f"{n_selected} qubits is within the NISQ device sweet spot."
            )
        elif n_selected <= 12:
            score = "good"
            explanation = (
                "Data can be processed with moderate quantum circuit depth. "
                f"{n_selected} qubits allows meaningful entanglement patterns."
            )
        elif n_selected <= 20:
            score = "fair"
            explanation = (
                "Data requires aggressive dimensionality reduction for quantum processing. "
                "Consider reducing to <= 12 features for better circuit performance."
            )
        else:
            score = "requires_reduction"
            explanation = (
                f"{n_selected} features exceed the recommended qubit count for simulation. "
                "Apply PCA or feature selection to reduce to <= 12 features before encoding."
            )

        return {
            "score": score,
            "explanation": explanation,
            "recommended_max_qubits": 8,
            "current_qubits": n_selected,
        }

    def estimate_simulation_time(self, n_qubits: int, n_samples: int) -> dict:
        """
        Rough estimate of simulation time for planning purposes.

        Args:
            n_qubits:  Number of qubits in the circuit.
            n_samples: Number of training samples.

        Returns:
            dict with time estimates and informational notes.
        """
        # PennyLane default.qubit scales as O(2^n_qubits) per circuit evaluation
        # Rough empirical constants for Nelder-Mead with 50 iterations
        base_time_per_eval_ms = (2 ** max(n_qubits - 4, 0)) * 5  # milliseconds
        n_evals = 50 * (n_qubits * self.n_layers * 2 + 1)        # Nelder-Mead simplex evals
        total_ms = base_time_per_eval_ms * n_evals
        total_seconds = total_ms / 1000.0

        return {
            "estimated_training_time_seconds":   round(total_seconds, 1),
            "estimated_training_time_human":      f"~{max(1, round(total_seconds / 60, 1))} minutes",
            "n_circuit_evaluations_approx":       n_evals,
            "note": (
                "Estimates are rough. Actual time depends on hardware and PennyLane version. "
                "Training uses at most 100 samples for the MVP."
            ),
        }
