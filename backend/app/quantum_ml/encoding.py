"""
Quantum feature encoding methods for QuantumHealth AI.
Team Member 3 - Quantum ML Layer.

Encoding converts classical normalized features into quantum rotation angles
applied as gate parameters in the quantum circuit.

Supported methods:
  - AngleEncoding    : RY(pi * x_i) per qubit  -- default, best for NISQ
  - AmplitudeEncoding: unit-vector state preparation

All encoding is SIMULATED on pennylane:default.qubit.
"""

import numpy as np


class AngleEncoding:
    """
    Encode classical features as rotation angles on qubits.

    Feature x_i is encoded as RY(pi * x_i) on qubit i.
    Input features must be normalized to [0, 1] before encoding.

    This is the default encoding for QuantumHealth AI because:
    - Simple and efficient for near-term quantum circuits
    - Direct mapping: one feature -> one qubit
    - Naturally bounded angles (0 to pi)
    """

    def __init__(self, n_qubits: int):
        """
        Initialize the angle encoder.

        Args:
            n_qubits: Number of qubits (must equal the number of selected features).
        """
        self.n_qubits = n_qubits
        self.name = "AngleEncoding"

    def encode(self, features: np.ndarray) -> np.ndarray:
        """
        Convert normalized features to RY rotation angles.

        Args:
            features: 1-D array of shape (n_qubits,) with values in [0, 1].

        Returns:
            angles: 1-D array of shape (n_qubits,) in radians, range [0, pi].

        Raises:
            AssertionError: If len(features) != n_qubits.
        """
        assert len(features) == self.n_qubits, (
            f"AngleEncoding expected {self.n_qubits} features, got {len(features)}"
        )
        return np.pi * np.clip(features, 0.0, 1.0)

    def get_info(self) -> dict:
        """Return a dictionary describing this encoder."""
        return {
            "name": self.name,
            "description": "RY rotation encoding: angle = pi x normalized_feature",
            "n_qubits": self.n_qubits,
            "input_range": "[0, 1]",
            "output_range": "[0, pi] radians",
            "gate": "RY",
        }


class AmplitudeEncoding:
    """
    Encode features as amplitudes of a quantum state.

    The feature vector is L2-normalized and used as the amplitude vector
    of a 2^n_qubits dimensional quantum state.

    Requirements:
        - n_features can be at most 2^n_qubits.
        - If n_features < 2^n_qubits the remaining amplitudes are zero-padded.

    Note: Amplitude encoding requires state-preparation circuits that grow
    exponentially in depth. Angle encoding is preferred for shallow circuits.
    """

    def __init__(self, n_qubits: int):
        """
        Initialize the amplitude encoder.

        Args:
            n_qubits: Number of qubits. Supports up to 2^n_qubits features.
        """
        self.n_qubits = n_qubits
        self.name = "AmplitudeEncoding"
        self.state_size = 2 ** n_qubits

    def encode(self, features: np.ndarray) -> np.ndarray:
        """
        Normalize features to a unit vector for amplitude encoding.

        Args:
            features: 1-D array of any length <= state_size.

        Returns:
            normalized: 1-D array of shape (state_size,), L2-normalized.
        """
        padded = np.zeros(self.state_size, dtype=np.float64)
        n = min(len(features), self.state_size)
        padded[:n] = features[:n]
        norm = np.linalg.norm(padded)
        if norm > 1e-10:
            padded = padded / norm
        return padded

    def get_info(self) -> dict:
        """Return a dictionary describing this encoder."""
        return {
            "name": self.name,
            "description": "Amplitude encoding: features normalized to unit state vector",
            "n_qubits": self.n_qubits,
            "state_size": self.state_size,
            "max_features": self.state_size,
        }


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

ENCODING_REGISTRY: dict = {
    "angle": AngleEncoding,
    "amplitude": AmplitudeEncoding,
}


def get_encoder(method: str, n_qubits: int):
    """
    Factory function to get an encoding instance by name.

    Args:
        method: One of 'angle' or 'amplitude'.
        n_qubits: Number of qubits for the encoder.

    Returns:
        An encoder instance with an .encode() method.

    Raises:
        ValueError: If method is not in ENCODING_REGISTRY.
    """
    if method not in ENCODING_REGISTRY:
        raise ValueError(
            f"Unknown encoding method '{method}'. "
            f"Choose from: {list(ENCODING_REGISTRY.keys())}"
        )
    return ENCODING_REGISTRY[method](n_qubits)
