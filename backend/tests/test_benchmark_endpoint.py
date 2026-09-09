import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_quantum_benchmark_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/quantum/benchmark",
            json={"n_qubits": 4, "n_layers": 2, "evaluations_per_backend": 5}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "benchmarks" in data
        assert len(data["benchmarks"]) == 5
        assert "optimal_fastest_simulator" in data
        
        # Verify NumPy and Lightning are both active
        names = [b["identifier"] for b in data["benchmarks"]]
        assert "numpy:statevector" in names
        assert "pennylane:lightning.qubit" in names
        assert "pennylane:default.qubit" in names

        # Verify numerical fidelity
        assert data["max_statevector_fidelity_deviation"] < 0.1
