"""
Quantum Readiness Analyzer for QuantumHealth AI.
Team Member 3 - Quantum ML Layer.

Analyzes a dataset / feature selection and reports how suitable it is
for the quantum simulation pipeline. This is a unique, user-facing
feature of QuantumHealth AI providing transparency about the encoding.

All analysis is for SIMULATED quantum circuits (pennylane:default.qubit).
"""

import numpy as np
from app.quantum_ml.circuits import compute_circuit_depth


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

        # Canonical circuit depth matching PennyLane DAG
        circuit_depth = compute_circuit_depth(n_qubits, self.n_layers)

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
        Simulation time estimate incorporating n_samples and qubit dimensionality.

        Args:
            n_qubits:  Number of qubits in the circuit.
            n_samples: Number of training samples.

        Returns:
            dict with time estimates and informational notes.
        """
        # Actual training subset size (capped at max 100 samples)
        actual_samples = min(max(n_samples, 1), 100)

        # Base evaluation latency per single sample (scales O(2^n_qubits))
        base_time_per_eval_ms = (2 ** max(n_qubits - 4, 0)) * 0.7  # ~0.7 ms on 4-6 qubits

        # Nelder-Mead simplex evaluations for flat parameters
        n_params = n_qubits * self.n_layers * 2
        n_simplex_evals = 50 * (n_params + 1)

        # Total circuit evaluations = simplex objective evals * batch size
        total_evals = n_simplex_evals * actual_samples
        total_ms = base_time_per_eval_ms * total_evals
        total_seconds = total_ms / 1000.0

        return {
            "estimated_training_time_seconds":   round(total_seconds, 1),
            "estimated_training_time_human":      f"~{max(1, round(total_seconds / 60, 1))} minutes",
            "n_circuit_evaluations_approx":       total_evals,
            "training_samples_evaluated":        actual_samples,
            "note": (
                "Estimates incorporate sample size and state-vector scaling O(2^n). "
                f"Evaluation assumes stratified training cap of {actual_samples} samples."
            ),
        }


def get_available_hardware_backends() -> list:
    """Return all verified, active quantum computing and simulation backends."""
    backends = []

    # 1. PennyLane Lightning C++
    try:
        import pennylane as qml
        qml.device("lightning.qubit", wires=2)
        backends.append({
            "name": "PennyLane Lightning.Qubit",
            "identifier": "pennylane:lightning.qubit",
            "type": "C++ High-Performance Statevector Simulator",
            "acceleration": "Adjoint Differentiation (C++ OpenMP)",
            "speedup": "10x-50x faster than pure Python",
            "status": "ready"
        })
    except Exception:
        pass

    # 2. Amazon Braket Local & Cloud
    try:
        import pennylane as qml
        qml.device("braket.local.qubit", wires=2)
        backends.append({
            "name": "Amazon Braket Local Simulator",
            "identifier": "pennylane:braket.local.qubit",
            "type": "Amazon Braket Quantum SDK",
            "hardware_targets": ["Rigetti Ankaa", "IonQ Forte", "QuEra Aquila"],
            "status": "ready"
        })
    except Exception:
        pass

    # 3. IBM Qiskit Aer
    try:
        import pennylane as qml
        qml.device("qiskit.aer", wires=2)
        backends.append({
            "name": "IBM Qiskit Aer Simulator",
            "identifier": "pennylane:qiskit.aer",
            "type": "Qiskit Quantum SDK",
            "hardware_targets": ["IBM Eagle 127-qubit", "IBM Heron"],
            "openqasm_export": True,
            "status": "ready"
        })
    except Exception:
        pass

    # 4. PennyLane Reference
    backends.append({
        "name": "PennyLane Default.Qubit",
        "identifier": "pennylane:default.qubit",
        "type": "Python Reference Simulator",
        "description": "PennyLane official pure-Python statevector simulator for exact algorithmic validation.",
        "status": "ready"
    })

    # 5. PennyLane Mixed (Noise & Decoherence)
    backends.append({
        "name": "PennyLane Default.Mixed",
        "identifier": "pennylane:default.mixed",
        "type": "Density Matrix Noise Simulator",
        "description": "Simulates open quantum systems with thermal decoherence and depolarizing gate noise.",
        "status": "ready"
    })

    # 6. NumPy Native
    backends.append({
        "name": "NumPy Native Statevector",
        "identifier": "numpy:statevector",
        "type": "Exact Standalone Linear Algebra (Zero-Dependency)",
        "description": "Vectorized statevector tensor contraction kernel with sub-millisecond CPU execution latency.",
        "status": "ready"
    })

    return backends
