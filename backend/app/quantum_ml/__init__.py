"""
quantum_ml package - PennyLane-based quantum simulation layer.
QuantumHealth AI (SIH 2026 Problem Statement 26139).

All quantum circuits run on PennyLane default.qubit SIMULATOR.
No real quantum hardware is used.
"""

try:
    from app.quantum_ml.vqc import QuantumClassifier
    PENNYLANE_AVAILABLE = True
except ImportError:
    PENNYLANE_AVAILABLE = False
    QuantumClassifier = None

__all__ = ["QuantumClassifier", "PENNYLANE_AVAILABLE"]
