from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.quantum import QuantumCircuitInfo
from app.core.config import settings
from app.datasets.loader import get_dataset_loader, DatasetLoader

router = APIRouter()

@router.get(
    "/quantum-config",
    response_model=QuantumCircuitInfo,
    summary="Get Quantum Circuit Architecture Specifications",
    description="Returns detailed gate specifications, depth, mapped feature registers, and PennyLane simulation details for a given disease."
)
async def get_quantum_config(
    disease: str = "diabetes",
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        disease_info = loader.get_disease_info(disease)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown disease module '{disease}': {str(e)}"
        )

    features = [f["name"] for f in disease_info["features"]]
    selected_features = features[:settings.quantum_n_qubits]
    feature_map = {feat: i for i, feat in enumerate(selected_features)}

    # Build representative ASCII circuit schematic
    ascii_lines = []
    for feat, q in feature_map.items():
        if q == 0:
            ascii_lines.append(f"q[{q}] ({feat[:7]:<7}) ──H──RY(θ_{q})──●────RZ(φ_{q})────⟨Z₀⟩")
        else:
            ascii_lines.append(f"q[{q}] ({feat[:7]:<7}) ──H──RY(θ_{q})──⊕────RZ(φ_{q})─────────")

    circuit_ascii = "\n".join(ascii_lines)

    return {
        "disease": disease,
        "n_qubits": settings.quantum_n_qubits,
        "n_layers": settings.quantum_n_layers,
        "circuit_depth": settings.quantum_n_layers * 2 + 1,
        "n_parameters": settings.quantum_n_qubits * settings.quantum_n_layers * 2,
        "gates_used": ["Hadamard", "RY (Angle Encoding)", "CNOT (Ring Topology)", "RZ (Variational)", "PauliZ Expectation"],
        "entanglement_method": "Ring CNOT Entanglement",
        "encoding_method": "Angle Encoding RY(π · x_i)",
        "backend": settings.quantum_backend,
        "circuit_ascii": circuit_ascii,
        "feature_to_qubit_map": feature_map
    }
