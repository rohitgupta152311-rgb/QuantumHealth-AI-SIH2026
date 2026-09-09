"""
Quantum Support Vector Machine (QSVM) / Quantum Kernel Classifier for QuantumHealth AI.
Implements quantum state fidelity kernel: K(x_i, x_j) = |<psi(x_i)|psi(x_j)>|^2
Based on Havlíček et al., Nature 567, 209-212 (2019).
Directly satisfies SIH26139 Deliverable 3: 'Variational Quantum Classifier (VQC), Quantum SVM'.
"""

import numpy as np
from sklearn.svm import SVC
from app.quantum_ml.encoding import AngleEncoding


class QuantumKernelClassifier:
    """
    Quantum Kernel Support Vector Machine (QSVM).
    
    Transforms classical biomedical vectors into quantum Hilbert space states |psi(x)>
    using parameterized unitary encoding, then computes the quantum fidelity kernel matrix:
        K_ij = |<psi(x_i) | psi(x_j)>|^2
    The resulting Gram matrix is optimized using a classical Maximum-Margin dual solver.
    """

    def __init__(self, n_qubits: int = 4, C: float = 1.0, probability: bool = True):
        self.n_qubits = n_qubits
        self.C = C
        self.probability = probability
        self.encoder = AngleEncoding(n_qubits)
        self.svc = SVC(kernel="precomputed", C=self.C, probability=self.probability, random_state=42)
        self.X_train_ = None
        self.train_states_ = None
        self._fitted: bool = False

    def _state_vector_from_angles(self, angles: np.ndarray) -> np.ndarray:
        """
        Compute the 2^n state-vector from input angle features in [0, pi]
        with separable RY rotations plus nearest-neighbor phase entanglement.
        """
        dim = 1 << self.n_qubits
        state = np.zeros(dim, dtype=complex)
        state[0] = 1.0

        # Separable tensor product of single-qubit states cos(theta/2)|0> + sin(theta/2)|1>
        for q in range(self.n_qubits):
            theta = float(angles[q]) if q < len(angles) else 0.0
            c = np.cos(theta / 2.0)
            s = np.sin(theta / 2.0)
            q_state = np.array([c, s], dtype=complex)
            
            dim_left = 1 << q
            dim_right = 1 << (self.n_qubits - q - 1)
            state = state.reshape((dim_left, 2, dim_right))
            state = np.einsum('ab,ibk->iak', np.diag(q_state), state).reshape(-1)

        # Entanglement phase factor: exp(i * phi_jk * Z_j * Z_k)
        for q in range(self.n_qubits - 1):
            theta_j = float(angles[q]) if q < len(angles) else 0.0
            theta_k = float(angles[q + 1]) if (q + 1) < len(angles) else 0.0
            phi_jk = (np.pi - theta_j) * (np.pi - theta_k)
            for idx in range(dim):
                bit_j = (idx >> (self.n_qubits - 1 - q)) & 1
                bit_k = (idx >> (self.n_qubits - 2 - q)) & 1
                parity = 1 if bit_j == bit_k else -1
                state[idx] *= np.exp(1j * 0.5 * phi_jk * parity)

        # Normalize state
        norm = np.linalg.norm(state)
        return state / norm if norm > 0 else state

    def compute_kernel_matrix(self, X1: np.ndarray, X2: np.ndarray) -> np.ndarray:
        """Compute quantum fidelity kernel matrix: K_ij = |<psi_i | psi_j>|^2."""
        # Convert input features to angles in [0, pi]
        angles1 = [self.encoder.encode(x) for x in X1]
        angles2 = [self.encoder.encode(x) for x in X2]

        states1 = np.array([self._state_vector_from_angles(a) for a in angles1])
        states2 = np.array([self._state_vector_from_angles(a) for a in angles2])

        # Matrix multiplication gives inner product matrix <psi_i | psi_j>
        overlap_matrix = np.dot(states1, states2.conj().T)
        fidelity_kernel = np.abs(overlap_matrix) ** 2
        return np.clip(fidelity_kernel, 0.0, 1.0)

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Fit the Quantum Kernel Support Vector Classifier."""
        self.X_train_ = np.asarray(X, dtype=float)
        y = np.asarray(y)

        # Precompute quantum Gram matrix
        K_train = self.compute_kernel_matrix(self.X_train_, self.X_train_)
        self.svc.fit(K_train, y)
        self._fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict class labels for test samples."""
        if not self._fitted:
            raise ValueError("QuantumKernelClassifier must be fitted before predicting.")
        X = np.asarray(X, dtype=float)
        K_test = self.compute_kernel_matrix(X, self.X_train_)
        return self.svc.predict(K_test)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict class probabilities for test samples."""
        if not self._fitted:
            raise ValueError("QuantumKernelClassifier must be fitted before predicting.")
        X = np.asarray(X, dtype=float)
        K_test = self.compute_kernel_matrix(X, self.X_train_)
        return self.svc.predict_proba(K_test)

    def get_info(self) -> dict:
        """Return model metadata."""
        return {
            "model_type": "Quantum Kernel Support Vector Machine (QSVM)",
            "n_qubits": self.n_qubits,
            "kernel_method": "Quantum State Fidelity |<psi(x)|psi(x')>|^2",
            "feature_map": "Havlicek et al. (Nature 2019) Non-linear Entangling Map",
            "is_fitted": self._fitted,
        }
