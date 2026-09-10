"""
Tests verifying the non-contradictory API contract:
- 422 for malformed/unknown fields
- 200 with status: "abstained" for out-of-distribution values and missing sentinels
- 200 with status: "completed" for valid cases with calibrated probabilities and separate explanations
"""
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_unknown_feature_rejected_with_422():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/predict",
            json={
                "disease": "diabetes",
                "features": {
                    "Glucose": 120,
                    "Age": 45,
                    "completely_fake_feature": 999.0
                }
            }
        )
        assert res.status_code == 422
        assert "Unknown or unexpected feature provided" in res.json()["detail"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_missing_sentinel_glucose_zero_triggers_abstention():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/predict",
            json={
                "disease": "diabetes",
                "features": {
                    "Pregnancies": 1,
                    "Glucose": 0,  # 0 is sentinel missing for Glucose in Pima cohort
                    "BloodPressure": 70,
                    "BMI": 25.0,
                    "DiabetesPedigreeFunction": 0.4,
                    "Age": 30
                }
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "abstained"
        assert "missing sentinel value" in data["abstention_reason"]
        assert data.get("hybrid_result") is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_out_of_distribution_triggers_abstention():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/predict",
            json={
                "disease": "diabetes",
                "features": {
                    "Pregnancies": 1,
                    "Glucose": 450.0,  # Model input range is [44, 250]
                    "BloodPressure": 70,
                    "BMI": 25.0,
                    "DiabetesPedigreeFunction": 0.4,
                    "Age": 30
                }
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "abstained"
        assert "outside the model-supported training range" in data["abstention_reason"]
        assert data.get("hybrid_result") is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_valid_input_completes_with_calibrated_explanations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/predict",
            json={
                "disease": "diabetes",
                "features": {
                    "Age": 45,
                    "Gender": 1,
                    "BMI": 24.0,
                    "SBP_mmHg": 120.0,
                    "DBP_mmHg": 80.0,
                    "FPG_mg_dL": 95.0,
                    "Cholesterol_mmol_L": 4.5,
                    "Triglyceride_mmol_L": 1.2,
                    "ALT_UL": 22.0,
                    "CCR_umol_L": 75.0,
                    "family_history_of_diabetes": 0
                }
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "completed"
        assert data["hybrid_result"] is not None
        assert "risk_probability" in data["hybrid_result"]
        assert "disagreement_range" in data
        assert "explanations" in data
        assert "classical" in data["explanations"]
        assert "quantum" in data["explanations"]
        assert "scope" in data["explanations"]
