"""Tests for model training (POST /api/v1/models/train)."""
import json
import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import make_diabetes_csv

pytestmark = pytest.mark.asyncio

TRAIN_URL = "/api/v1/models/train"
UPLOAD_URL = "/api/v1/datasets/upload"


# ---- Force retrain --------------------------------------------------------

async def test_force_retrain_creates_models(client: AsyncClient):
    """Training with force_retrain=true should create model files and return metrics."""
    resp = await client.post(
        TRAIN_URL,
        json={"disease": "diabetes", "force_retrain": True},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["status"] == "success"
    assert body["disease"] == "diabetes"
    assert body["experiment_id"] >= 1
    assert body["model_version_id"] >= 1
    assert len(body["data_hash"]) == 64  # SHA-256 hex

    # Metrics structure
    metrics = body["metrics"]
    for key in ("classical", "quantum", "hybrid", "improvement"):
        assert key in metrics, f"Missing key: {key}"

    # Classical metrics must have real evaluated values
    for m in ("accuracy", "precision", "recall", "f1_score", "auc_roc"):
        assert isinstance(metrics["classical"][m], float)
        assert 0 <= metrics["classical"][m] <= 1


async def test_force_retrain_overwrites_cached(client: AsyncClient):
    """Two successive force_retrain calls should both succeed (overwriting models)."""
    resp1 = await client.post(
        TRAIN_URL,
        json={"disease": "diabetes", "force_retrain": True},
    )
    assert resp1.status_code == 200
    id1 = resp1.json()["model_version_id"]

    resp2 = await client.post(
        TRAIN_URL,
        json={"disease": "diabetes", "force_retrain": True},
    )
    assert resp2.status_code == 200
    id2 = resp2.json()["model_version_id"]
    assert id2 > id1, "Second train should create a new model_version"


# ---- Cached models (no retrain) ------------------------------------------

async def test_cached_models_used_when_no_retrain(client: AsyncClient):
    """After initial train, force_retrain=false should use cached models."""
    # First train
    await client.post(
        TRAIN_URL,
        json={"disease": "diabetes", "force_retrain": True},
    )
    # Second call without force_retrain
    resp = await client.post(
        TRAIN_URL,
        json={"disease": "diabetes", "force_retrain": False},
    )
    assert resp.status_code == 200
    assert "cached" in resp.json()["status"].lower()


# ---- Uploaded samples included in training --------------------------------

async def test_uploaded_samples_in_training(client: AsyncClient):
    """Uploaded CSV rows should appear in the training data metadata."""
    # Upload 20 rows
    csv_buf = make_diabetes_csv()
    upload_resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("train.csv", csv_buf, "text/csv")},
    )
    assert upload_resp.status_code == 201

    # Train
    train_resp = await client.post(
        TRAIN_URL,
        json={"disease": "diabetes", "force_retrain": True},
    )
    assert train_resp.status_code == 200
    data_info = train_resp.json()["data_info"]
    assert data_info["uploaded_rows"] == 20
    assert data_info["total_rows"] == data_info["base_rows"] + 20


# ---- Validation errors on bad data ---------------------------------------

async def test_unknown_disease_rejected(client: AsyncClient):
    """Unknown disease should return 422."""
    resp = await client.post(
        TRAIN_URL,
        json={"disease": "malaria", "force_retrain": True},
    )
    assert resp.status_code == 422
    assert "Unknown disease" in resp.json()["detail"]
