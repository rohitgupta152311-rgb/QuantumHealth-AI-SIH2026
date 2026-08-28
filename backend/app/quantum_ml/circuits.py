"""
PennyLane quantum circuits for the Variational Quantum Classifier (VQC).
Team Member 3 - Quantum ML Layer - QuantumHealth AI.

Circuit Architecture
--------------------
1. Angle Encoding layer  : RY(pi * x_i) on qubit i
2. Variational layers (x n_layers):
   a. Parameterized rotations : RY(theta) + RZ(phi) on each qubit
   b. Entanglement            : CNOT ring topology
3. Measurement               : Expectation value <Z_0>

All circuits run on pennylane:default.qubit (SIMULATOR).
No real quantum hardware is required or used.
"""

import numpy as np

try:
    import pennylane as qml
    PENNYLANE_AVAILABLE = True
except ImportError:
    PENNYLANE_AVAILABLE = False


def build_vqc_circuit(n_qubits: int, n_layers: int, dev=None):
    """
    Build and return a PennyLane QNode for the Variational Quantum Classifier.

    Architecture
    ------------
    1. Angle encoding layer  : RY(pi * x_i) on each qubit
    2. Variational layers (n_layers times):
       a. Parameterized RY and RZ rotations on each qubit
       b. Entanglement: CNOT gates in a ring topology
    3. Measurement: <Z> on qubit 0

    Args:
        n_qubits : Number of qubits (= number of selected features).
        n_layers : Number of variational layers.
        dev      : PennyLane device. Defaults to default.qubit if None.

    Returns:
        QNode: circuit(params, x) -> float

    Raises:
        ImportError: If PennyLane is not installed.
    """
    if not PENNYLANE_AVAILABLE:
        raise ImportError(
            "PennyLane is not installed. Run: pip install pennylane"
        )

    if dev is None:
        dev = qml.device("default.qubit", wires=n_qubits)

    @qml.qnode(dev, interface="numpy")
    def circuit(params, x):
        """
        Execute the VQC circuit.

        Args:
            params : np.ndarray of shape (n_layers, n_qubits, 2)
                     params[layer, qubit, 0] = RY angle
                     params[layer, qubit, 1] = RZ angle
            x      : np.ndarray of shape (n_qubits,) - encoded feature angles

        Returns:
            float: Expectation value of PauliZ on qubit 0, in [-1, +1].
        """
        # --- Encoding Layer -------------------------------------------
        for i in range(n_qubits):
            qml.RY(x[i], wires=i)

        # --- Variational Layers ---------------------------------------
        for layer in range(n_layers):
            # Parameterized rotations
            for qubit in range(n_qubits):
                qml.RY(params[layer, qubit, 0], wires=qubit)
                qml.RZ(params[layer, qubit, 1], wires=qubit)

            # Entanglement: ring topology CNOT gates
            for qubit in range(n_qubits - 1):
                qml.CNOT(wires=[qubit, qubit + 1])
            if n_qubits > 1:
                qml.CNOT(wires=[n_qubits - 1, 0])

        # --- Measurement ----------------------------------------------
        return qml.expval(qml.PauliZ(0))

    return circuit


def get_circuit_info(n_qubits: int, n_layers: int) -> dict:
    """
    Return human-readable metadata about the VQC circuit.

    Args:
        n_qubits: Number of qubits.
        n_layers: Number of variational layers.

    Returns:
        dict with circuit statistics.
    """
    # RY + RZ per qubit per layer
    n_params = n_layers * n_qubits * 2
    # encoding layer + (rotation + CNOT ring) per variational layer + measurement
    circuit_depth = 1 + n_layers * (1 + n_qubits) + 1

    return {
        "n_qubits": n_qubits,
        "n_layers": n_layers,
        "circuit_depth": circuit_depth,
        "n_parameters": n_params,
        "gates_used": ["RY", "RZ", "CNOT"],
        "entanglement_method": "Ring topology CNOT",
        "encoding_method": "Angle Encoding (RY rotations)",
        "backend": "pennylane:default.qubit (simulator)",
        "simulation_status": "simulated",
        "pennylane_available": PENNYLANE_AVAILABLE,
    }


def get_feature_to_qubit_map(feature_names: list) -> dict:
    """
    Map selected feature names to qubit indices.

    Args:
        feature_names: Ordered list of feature names (index = qubit wire).

    Returns:
        dict mapping feature name -> qubit index.
    """
    return {feat: i for i, feat in enumerate(feature_names)}
