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
