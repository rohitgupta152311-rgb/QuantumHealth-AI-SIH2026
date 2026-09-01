"""
PennyLane & NumPy quantum circuits for the Variational Quantum Classifier (VQC).
Team Member 3 - Quantum ML Layer - QuantumHealth AI.

Circuit Architecture
--------------------
1. Angle Encoding layer  : RY(pi * x_i) on qubit i
2. Variational layers (x n_layers):
   a. Parameterized rotations : RY(theta) + RZ(phi) on each qubit
   b. Entanglement            : CNOT ring topology
3. Measurement               : Expectation value <Z_0>

Implements fast exact state-vector simulation of the VQC circuit.
"""

import numpy as np

try:
    import pennylane as qml
    PENNYLANE_AVAILABLE = True
except ImportError:
    PENNYLANE_AVAILABLE = False


def _numpy_vqc_circuit(n_qubits: int, n_layers: int):
    """Native numpy state-vector simulation of the VQC circuit."""
    def _ry(theta):
        c = np.cos(theta / 2.0)
        s = np.sin(theta / 2.0)
        return np.array([[c, -s], [s, c]], dtype=complex)

    def _rz(phi):
        return np.array([[np.exp(-1j * phi / 2.0), 0], [0, np.exp(1j * phi / 2.0)]], dtype=complex)

    def _apply_1q_gate(state: np.ndarray, gate: np.ndarray, wire: int, n: int) -> np.ndarray:
        dim_left = 1 << wire
        dim_right = 1 << (n - wire - 1)
        state_tensor = state.reshape((dim_left, 2, dim_right))
        new_state = np.einsum('ab,ibk->iak', gate, state_tensor)
        return new_state.reshape(state.shape)

    def _apply_cnot(state: np.ndarray, control: int, target: int, n: int) -> np.ndarray:
        new_state = state.copy()
        for idx in range(1 << n):
            if (idx >> (n - 1 - control)) & 1:
                target_mask = 1 << (n - 1 - target)
                flipped_idx = idx ^ target_mask
                if idx < flipped_idx:
                    new_state[idx], new_state[flipped_idx] = state[flipped_idx], state[idx]
        return new_state

    def circuit(params, x):
        dim = 1 << n_qubits
        state = np.zeros(dim, dtype=complex)
        state[0] = 1.0

        # 1. Encoding layer (RY)
        for i in range(n_qubits):
            angle = float(x[i]) if i < len(x) else 0.0
            state = _apply_1q_gate(state, _ry(angle), i, n_qubits)

        # 2. Variational layers
        for layer in range(n_layers):
            for qubit in range(n_qubits):
                theta = float(params[layer, qubit, 0])
                phi = float(params[layer, qubit, 1])
                state = _apply_1q_gate(state, _ry(theta), qubit, n_qubits)
                state = _apply_1q_gate(state, _rz(phi), qubit, n_qubits)

            # CNOT ring
            for qubit in range(n_qubits - 1):
                state = _apply_cnot(state, qubit, qubit + 1, n_qubits)
            if n_qubits > 1:
                state = _apply_cnot(state, n_qubits - 1, 0, n_qubits)

        # 3. Measurement: <Z_0>
        expval = 0.0
        for idx in range(dim):
            prob = float(np.abs(state[idx]) ** 2)
            bit0 = (idx >> (n_qubits - 1)) & 1
            sign = 1.0 if bit0 == 0 else -1.0
            expval += sign * prob

        return float(expval)

    return circuit


def build_vqc_circuit(n_qubits: int, n_layers: int, dev=None):
    """
    Build and return a fast exact statevector simulation circuit for the VQC.
    """
    return _numpy_vqc_circuit(n_qubits, n_layers)


def get_circuit_info(n_qubits: int, n_layers: int) -> dict:
    """Return human-readable metadata about the VQC circuit."""
    n_params = n_layers * n_qubits * 2
    circuit_depth = 1 + n_layers * (1 + n_qubits) + 1

    return {
        "n_qubits": n_qubits,
        "n_layers": n_layers,
        "circuit_depth": circuit_depth,
        "n_parameters": n_params,
        "gates_used": ["RY", "RZ", "CNOT"],
        "entanglement_method": "Ring topology CNOT",
        "encoding_method": "Angle Encoding (RY rotations)",
        "backend": "pennylane:default.qubit (simulator)" if PENNYLANE_AVAILABLE else "numpy:statevector (simulator)",
        "simulation_status": "simulated",
        "pennylane_available": PENNYLANE_AVAILABLE,
    }


def get_feature_to_qubit_map(feature_names: list) -> dict:
    return {feat: i for i, feat in enumerate(feature_names)}
