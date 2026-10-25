from fastapi.testclient import TestClient
from main import app

def test_endpoints():
    client = TestClient(app)
    print("=== Testing /split-insights endpoint ===")
    res = client.get("/api/v1/diseases/heart/split-insights?test_size=0.20")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "Cardiovascular" in data.get("disease_name", "") or data.get("disease_name") == "heart"
    assert data["total_samples"] > 0
    assert data["requested_test_pct"] == 20.0
    assert "split_breakdown" in data
    assert "statistical_insights" in data

    print("\n=== Testing /quantum/backends endpoint ===")
    res_b = client.get("/api/v1/quantum/backends")
    assert res_b.status_code == 200, f"Expected 200, got {res_b.status_code}: {res_b.text}"
    data_b = res_b.json()
    assert len(data_b["available_backends"]) > 0

    print("\n=== Testing prediction with custom quantum_weight (70%) and custom simulator ===")
    payload = {
        "disease": "heart",
        "features": {
            "age": 64, "sex": 1, "cp": 3, "trestbps": 160, "chol": 295,
            "fbs": 1, "restecg": 2, "thalach": 122, "exang": 1,
            "oldpeak": 2.8, "slope": 0, "ca": 2, "thal": 3
        },
        "mode": "hybrid",
        "quantum_weight": 0.70,
        "quantum_backend": "pennylane:default.qubit"
    }
    pred_res = client.post("/api/v1/predict", json=payload)
    assert pred_res.status_code == 200, f"Expected 200, got {pred_res.status_code}: {pred_res.text}"
    res_json = pred_res.json()
    assert res_json.get("status") == "completed"
    assert res_json.get("hybrid_result") is not None
    assert res_json.get("hybrid_result", {}).get("quantum_weight") == 0.70

if __name__ == "__main__":
    test_endpoints()
    print("All endpoints tested successfully!")
