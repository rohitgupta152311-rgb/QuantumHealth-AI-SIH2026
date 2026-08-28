import pytest

@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["simulation_mode"] is True
    assert "quantum_backend" in data

@pytest.mark.asyncio
async def test_get_diseases(async_client):
    response = await async_client.get("/api/v1/diseases")
    assert response.status_code == 200
    data = response.json()
    assert "diseases" in data
    assert len(data["diseases"]) == 3
    disease_ids = [d["id"] for d in data["diseases"]]
    assert "diabetes" in disease_ids
    assert "heart" in disease_ids
    assert "breast_cancer" in disease_ids

@pytest.mark.asyncio
async def test_get_disease_details(async_client):
    response = await async_client.get("/api/v1/diseases/diabetes")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "diabetes"
    assert len(data["features"]) == 8

    # Non-existent disease
    err_res = await async_client.get("/api/v1/diseases/unknown_disease_xyz")
    assert err_res.status_code == 404

@pytest.mark.asyncio
async def test_get_models(async_client):
    response = await async_client.get("/api/v1/models")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    model_names = [m["name"] for m in data]
    assert "RandomForest" in model_names
    assert "Hybrid VQC" in model_names

@pytest.mark.asyncio
async def test_model_comparison(async_client):
    response = await async_client.get("/api/v1/models/model-comparison?disease=diabetes")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) >= 4
    assert "verdict" in data
    assert "winner" in data

@pytest.mark.asyncio
async def test_quantum_config(async_client):
    response = await async_client.get("/api/v1/quantum/quantum-config?disease=diabetes")
    assert response.status_code == 200
    data = response.json()
    assert data["n_qubits"] == 6
    assert "pennylane" in data["backend"]
    assert "feature_to_qubit_map" in data
    assert len(data["feature_to_qubit_map"]) == 6

@pytest.mark.asyncio
async def test_predict_diabetes_success(async_client):
    sample_payload = {
        "disease": "diabetes",
        "features": {
            "Pregnancies": 2,
            "Glucose": 120,
            "BloodPressure": 70,
            "SkinThickness": 25,
            "Insulin": 80,
            "BMI": 28.5,
            "DiabetesPedigreeFunction": 0.45,
            "Age": 35
        },
        "mode": "hybrid"
    }
    response = await async_client.post("/api/v1/predict", json=sample_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["disease"] == "diabetes"
    assert "hybrid_result" in data
    assert "classical_results" in data
    assert "quantum_result" in data
    assert "consensus" in data
    assert "feature_importance" in data
    assert "quantum_readiness" in data
    assert data["quantum_result"]["simulation_mode"] is True
    assert data["hybrid_result"]["risk_level"] in ["low", "moderate", "high", "very_high"]

@pytest.mark.asyncio
async def test_predict_validation_errors(async_client):
    # Missing required features
    incomplete_payload = {
        "disease": "diabetes",
        "features": {
            "Glucose": 120
            # Missing other 7 features
        }
    }
    response = await async_client.post("/api/v1/predict", json=incomplete_payload)
    assert response.status_code == 422

    # Invalid disease
    invalid_disease_payload = {
        "disease": "invalid_disease",
        "features": {"a": 1}
    }
    response = await async_client.post("/api/v1/predict", json=invalid_disease_payload)
    assert response.status_code == 422
