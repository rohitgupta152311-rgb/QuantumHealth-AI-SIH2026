"""
Tests for Firebase & Firestore integration in QuantumHealth AI.
Covers:
- Connection status and dual-mode discovery
- Firebase ID token verification & clinician role extraction
- Prediction persistence & retrieval from Firestore/Mock store
- Population batch triage storage & retrieval
- Clinical sentinel audit event logging
- Background task synchronization during /predict calls
"""

import pytest
from httpx import AsyncClient
from app.core.firebase import firebase_manager
from app.services.firebase_service import get_firebase_service


@pytest.mark.asyncio
async def test_firebase_status(client: AsyncClient):
    """Test GET /api/v1/firebase/status returns correct metadata and health state."""
    response = await client.get("/api/v1/firebase/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["mode"] in ("live", "mock_offline")
    assert "project_id" in data
    assert "firebase_admin_version" in data
    assert isinstance(data["is_live_cloud"], bool)


@pytest.mark.asyncio
async def test_verify_token_clinician(client: AsyncClient):
    """Test POST /api/v1/firebase/verify-token with clinician token."""
    response = await client.post(
        "/api/v1/firebase/verify-token",
        json={"token": "mock-doctor-token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["role"] == "clinician"
    assert "doctor" in data["email"].lower()
    assert data["is_mock"] is True


@pytest.mark.asyncio
async def test_verify_token_asha_worker(client: AsyncClient):
    """Test POST /api/v1/firebase/verify-token with ASHA health worker token."""
    response = await client.post(
        "/api/v1/firebase/verify-token",
        json={"token": "asha-worker-token-xyz"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["role"] == "asha_worker"
    assert "asha" in data["email"].lower()


@pytest.mark.asyncio
async def test_verify_token_general(client: AsyncClient):
    """Test POST /api/v1/firebase/verify-token with standard auth token."""
    response = await client.post(
        "/api/v1/firebase/verify-token",
        json={"token": "custom-clinician-jwt-token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert len(data["uid"]) > 0


@pytest.mark.asyncio
async def test_sync_and_retrieve_prediction(client: AsyncClient):
    """Test POST /api/v1/firebase/predictions and GET /api/v1/firebase/predictions."""
    mock_prediction_payload = {
        "prediction": {
            "disease": "diabetes",
            "status": "completed",
            "hybrid_result": {
                "risk_probability": 0.78,
                "risk_percentage": 78.0,
                "risk_level": "High Risk"
            },
            "quantum_result": {
                "qubits_used": 6,
                "backend": "pennylane:default.qubit",
                "execution_time_ms": 42.5
            },
            "consensus": {
                "agreement": "High",
                "recommendation": "Initiate HbA1c screening",
                "final_vote": 1
            },
            "schema_version": "v2.0",
            "cohort": "Dryad/BMJ Open Chinese Cohort"
        },
        "clinician_id": "dr-sharma-101",
        "patient_ref": "PT-INDIA-8829"
    }

    # Save prediction
    post_res = await client.post(
        "/api/v1/firebase/predictions",
        json=mock_prediction_payload,
        headers={"Authorization": "Bearer mock-doctor-token"}
    )
    assert post_res.status_code == 200
    res_data = post_res.json()
    assert res_data["status"] == "saved"
    doc_id = res_data["id"]
    assert len(doc_id) > 0

    # Retrieve specific prediction
    get_res = await client.get(f"/api/v1/firebase/predictions/{doc_id}")
    assert get_res.status_code == 200
    doc_data = get_res.json()
    assert doc_data["id"] == doc_id
    assert doc_data["disease"] == "diabetes"
    assert doc_data["risk_level"] == "High Risk"
    assert doc_data["patient_ref"] == "PT-INDIA-8829"
    assert doc_data["clinician_id"] == "dr-sharma-101"

    # List predictions with disease filter
    list_res = await client.get("/api/v1/firebase/predictions?disease=diabetes")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    found = any(p["id"] == doc_id for p in list_data["predictions"])
    assert found is True


@pytest.mark.asyncio
async def test_get_nonexistent_prediction_404(client: AsyncClient):
    """Test GET /api/v1/firebase/predictions/{doc_id} with non-existent ID returns 404."""
    response = await client.get("/api/v1/firebase/predictions/non-existent-uuid-12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_batch_triage_flow(client: AsyncClient):
    """Test POST and GET /api/v1/firebase/batch-triage."""
    triage_payload = {
        "disease": "diabetes",
        "total_patients": 500,
        "high_risk_count": 82,
        "moderate_risk_count": 145,
        "low_risk_count": 273,
        "abstained_count": 0,
        "icmr_recalibrated": True,
        "execution_time_s": 3.42
    }

    # Record triage summary
    post_res = await client.post("/api/v1/firebase/batch-triage", json=triage_payload)
    assert post_res.status_code == 200
    triage_id = post_res.json()["id"]
    assert len(triage_id) > 0

    # Retrieve triage records
    list_res = await client.get("/api/v1/firebase/batch-triage")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    found = any(item["id"] == triage_id for item in data["batch_triage_runs"])
    assert found is True


@pytest.mark.asyncio
async def test_clinical_audits_endpoint(client: AsyncClient):
    """Test GET /api/v1/firebase/audits after logging a safety event."""
    service = get_firebase_service()
    audit_id = await service.log_audit_event(
        event_type="safety_sentinel_abstention",
        details={
            "reason": "Classical and Quantum VQC probability spread > 0.40",
            "classical_prob": 0.85,
            "quantum_prob": 0.35,
            "disease": "heart"
        },
        clinician_id="sentinel-guard-auto"
    )
    assert len(audit_id) > 0

    # Fetch audit events
    res = await client.get("/api/v1/firebase/audits")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    found = any(a["id"] == audit_id for a in data["audit_events"])
    assert found is True


@pytest.mark.integration
@pytest.mark.asyncio
async def test_predict_endpoint_syncs_to_firebase(client: AsyncClient):
    """
    Test that calling POST /api/v1/predict persists the diagnostic
    assessment to Firestore/mock store via FastAPI BackgroundTasks.
    """
    prediction_req = {
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
        "mode": "hybrid"
    }

    # Call predict endpoint
    res = await client.post("/api/v1/predict", json=prediction_req)
    assert res.status_code == 200
    pred_data = res.json()
    assert pred_data["disease"] == "diabetes"

    # Check that predictions collection received a record
    fb_res = await client.get("/api/v1/firebase/predictions?disease=diabetes")
    assert fb_res.status_code == 200
    records = fb_res.json()["predictions"]
    assert len(records) >= 1
    # Verify the most recent record matches
    latest = records[0]
    assert latest["disease"] == "diabetes"
    assert latest["status"] in ("completed", "abstained")