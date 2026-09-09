from typing import Optional, Dict, List
from pydantic import BaseModel, Field

class QuantumCircuitInfo(BaseModel):
    disease: str = Field(..., description="Target disease module")
    n_qubits: int = Field(..., description="Number of qubits allocated")
    n_layers: int = Field(..., description="Number of variational ansatz layers")
    circuit_depth: int = Field(..., description="Calculated circuit depth")
    n_parameters: int = Field(..., description="Total trainable variational parameters")
    gates_used: List[str] = Field(..., description="Quantum gates utilized in circuit")
    entanglement_method: str = Field(..., description="Entanglement topology (e.g. 'Ring CNOT Entanglement')")
    encoding_method: str = Field(..., description="Feature encoding method (e.g. 'Angle Encoding RY(pi*x)')")
    backend: str = Field(..., description="Quantum simulator backend")
    circuit_ascii: Optional[str] = Field(None, description="ASCII schematic of the quantum circuit")
    feature_to_qubit_map: Dict[str, int] = Field(..., description="Mapping of clinical features to qubit wires")


class QuantumSimulateRequest(BaseModel):
    disease: str = Field("diabetes", description="Target disease identifier")
    features: Optional[Dict[str, float]] = Field(None, description="Clinical feature values")
    backend: str = Field("numpy:statevector", description="'numpy:statevector' or 'pennylane:default.qubit'")


class QuantumSimulateResponse(BaseModel):
    disease: str
    backend: str
    n_qubits: int
    circuit_depth: int
    expectation_value: float = Field(..., description="Raw PauliZ expectation value <Z_0> in [-1, 1]")
    born_probability: float = Field(..., description="Born rule probability (1 - <Z_0>)/2 in [0, 1]")
    execution_time_ms: float
    selected_features: List[str]
    circuit_ascii: str


class QuantumBenchmarkRequest(BaseModel):
    n_qubits: int = Field(6, ge=2, le=10, description="Number of qubits to evaluate")
    n_layers: int = Field(2, ge=1, le=4, description="Number of variational ansatz layers")
    evaluations_per_backend: int = Field(15, ge=3, le=50, description="Repeated circuit runs for timing")


class SimulatorBenchmarkResult(BaseModel):
    name: str
    identifier: str
    type: str
    available: bool
    status: str
    latency_ms_per_eval: float
    throughput_evals_per_sec: float
    speedup_factor_vs_reference: float
    expectation_value: float
    deviation_from_exact: float
    hardware_ecosystem: str
    capabilities: List[str]


class QuantumBenchmarkResponse(BaseModel):
    n_qubits: int
    n_layers: int
    circuit_depth: int
    n_parameters: int
    evaluations_per_backend: int
    optimal_fastest_simulator: str
    optimal_nisq_target_simulator: str
    max_statevector_fidelity_deviation: float
    benchmarks: List[SimulatorBenchmarkResult]


class QuantumNoiseSimulationRequest(BaseModel):
    n_qubits: int = Field(6, ge=2, le=10)
    n_layers: int = Field(2, ge=1, le=4)
    depolarizing_error_rate: float = Field(0.01, ge=0.0, le=0.20, description="Single/two-qubit gate error rate p in [0.0, 0.20]")
    readout_error_rate: float = Field(0.02, ge=0.0, le=0.15, description="Measurement readout bit-flip error rate in [0.0, 0.15]")


class QuantumNoiseSimulationResponse(BaseModel):
    n_qubits: int
    n_layers: int
    circuit_depth: int
    total_gate_count: int
    ideal_state_fidelity: float
    noisy_state_fidelity: float
    fidelity_retention_pct: float
    ideal_expectation: float
    noisy_expectation: float
    ideal_risk_probability: float
    noisy_risk_probability: float
    expectation_shift: float
    quantum_parameter_count: int
    classical_rf_node_count: int
    parameter_compression_ratio: float
    hilbert_space_dimension: int
    nisq_stability_verdict: str
    noise_curve: List[Dict[str, float]]


