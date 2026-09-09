import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_all_diseases_end_to_end_predict():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Diabetes (Chinese cohort)
        diabetes_payload = {
            "disease": "diabetes",
            "features": {
                "Age": 45.0,
                "Gender": 1.0,
                "BMI": 26.5,
                "SBP_mmHg": 130.0,
                "DBP_mmHg": 82.0,
                "FPG_mg_dL": 105.0,
                "Cholesterol_mmol_L": 5.2,
                "Triglyceride_mmol_L": 1.8,
                "ALT_UL": 28.0,
                "CCR_umol_L": 68.0,
                "family_history_of_diabetes": 0.0,
            },
            "mode": "hybrid",
        }
        res_d = await client.post("/api/v1/predict", json=diabetes_payload)
        assert res_d.status_code == 200, f"Diabetes prediction failed: {res_d.text}"
        data_d = res_d.json()
        assert data_d["disease"] == "diabetes"
        assert data_d["status"] in ("completed", "abstained")
        if data_d["status"] == "completed":
            assert "hybrid_result" in data_d
            assert "consensus" in data_d
        else:
            assert data_d["abstention_reason"] is not None

        # 2. Heart (Cleveland 303)
        heart_payload = {
            "disease": "heart",
            "features": {
                "age": 55.0,
                "sex": 1.0,
                "cp": 1.0,
                "trestbps": 130.0,
                "chol": 240.0,
                "fbs": 0.0,
                "restecg": 0.0,
                "thalach": 150.0,
                "exang": 0.0,
                "oldpeak": 1.2,
                "slope": 1.0,
                "ca": 0.0,
                "thal": 2.0,
            },
            "mode": "hybrid",
        }
        res_h = await client.post("/api/v1/predict", json=heart_payload)
        assert res_h.status_code == 200, f"Heart prediction failed: {res_h.text}"
        data_h = res_h.json()
        assert data_h["disease"] == "heart"
        assert data_h["status"] in ("completed", "abstained")

        # 3. Breast Cancer (WDBC 569)
        bc_payload = {
            "disease": "breast_cancer",
            "features": {
                "mean radius": 14.5,
                "mean texture": 19.2,
                "mean perimeter": 94.0,
                "mean area": 650.0,
                "mean smoothness": 0.095,
                "mean compactness": 0.105,
                "mean concavity": 0.075,
                "mean concave points": 0.045,
                "mean symmetry": 0.18,
                "mean fractal dimension": 0.062,
            },
            "mode": "hybrid",
        }
        res_bc = await client.post("/api/v1/predict", json=bc_payload)
        assert res_bc.status_code == 200, f"Breast Cancer prediction failed: {res_bc.text}"
        data_bc = res_bc.json()
        assert data_bc["disease"] == "breast_cancer"
        assert data_bc["status"] in ("completed", "abstained")

        # 4. Kidney (Apollo 400)
        kidney_payload = {
            "disease": "kidney",
            "features": {
                "age": 50.0,
                "bp": 80.0,
                "sg": 1.020,
                "al": 1.0,
                "su": 0.0,
                "bgr": 120.0,
                "bu": 35.0,
                "sc": 1.1,
                "sod": 138.0,
                "pot": 4.4,
                "hemo": 13.5,
                "htn": 0.0,
            },
            "mode": "hybrid",
        }
        res_k = await client.post("/api/v1/predict", json=kidney_payload)
        assert res_k.status_code == 200, f"Kidney prediction failed: {res_k.text}"
        data_k = res_k.json()
        assert data_k["disease"] == "kidney"
        assert data_k["status"] in ("completed", "abstained")
