"""Tests for dataset upload endpoint (POST /api/v1/datasets/upload)."""
import io
import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.datasets.loader import get_dataset_loader
from tests.conftest import make_diabetes_csv, make_csv_bytes

pytestmark = pytest.mark.asyncio

UPLOAD_URL = "/api/v1/datasets/upload"
DIABETES_FEATURES = get_dataset_loader().get_feature_names("diabetes")


# ---- Valid upload ---------------------------------------------------------

async def test_valid_csv_upload(client: AsyncClient):
    """A well-formed diabetes CSV should be accepted in full."""
    csv_buf = make_diabetes_csv()
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("valid.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["disease"] == "diabetes"
    assert body["accepted_rows"] == 20
    assert body["rejected_rows"] == 0
    assert body["validation_errors"] == []
    assert body["dataset_id"] >= 1


# ---- Invalid schema -------------------------------------------------------

async def test_invalid_schema_missing_column(client: AsyncClient):
    """CSV missing a required column should be rejected with 422."""
    cols = DIABETES_FEATURES[:-1] + ["label"]  # drop last feature
    rows = [[1.0] * len(cols)]
    csv_buf = make_csv_bytes(cols, rows)
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("bad.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 422
    assert "Missing columns" in resp.json()["detail"]


async def test_invalid_schema_extra_column(client: AsyncClient):
    """CSV with an extra column should be rejected with 422."""
    cols = DIABETES_FEATURES + ["label", "extra_col"]
    rows = [[1.0] * len(cols)]
    csv_buf = make_csv_bytes(cols, rows)
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("bad.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 422
    assert "Unexpected columns" in resp.json()["detail"]


# ---- Invalid / missing labels ---------------------------------------------

async def test_invalid_label_value(client: AsyncClient):
    """Labels other than 0/1 should be rejected per-row."""
    cols = DIABETES_FEATURES + ["label"]
    rows = [
        [100, 80, 25, 45, 100, 30, 2, 0.5, 0],   # good
        [100, 80, 25, 45, 100, 30, 2, 0.5, 2],   # bad label=2
        [100, 81, 25, 45, 100, 30, 2, 0.5, -1],  # bad label=-1
    ]
    csv_buf = make_csv_bytes(cols, rows)
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("labels.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["accepted_rows"] == 1
    assert body["rejected_rows"] == 2
    label_errors = [e for e in body["validation_errors"] if e["column"] == "label"]
    assert len(label_errors) == 2


async def test_non_numeric_label(client: AsyncClient):
    """A text label like 'yes' should be rejected."""
    cols = DIABETES_FEATURES + ["label"]
    rows = [[100, 80, 25, 45, 100, 30, 2, 0.5, "yes"]]
    csv_buf = make_csv_bytes(cols, rows)
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("textlabel.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["accepted_rows"] == 0
    assert body["rejected_rows"] == 1


# ---- Missing / non-numeric features ---------------------------------------

async def test_missing_values_rejected(client: AsyncClient):
    """Rows with NaN / blank cells should be rejected."""
    cols = DIABETES_FEATURES + ["label"]
    rows = [
        [100, 80, 25, 45, 100, 30, 2, 0.5, 1],         # good
        [100, None, 25, 45, 100, 30, 2, 0.5, 0],        # missing value
    ]
    csv_buf = make_csv_bytes(cols, rows)
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("missing.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["accepted_rows"] == 1
    assert body["rejected_rows"] == 1
    missing_errors = [e for e in body["validation_errors"] if "Missing" in e["error"]]
    assert len(missing_errors) >= 1


# ---- Duplicate rows -------------------------------------------------------

async def test_duplicate_rows_rejected(client: AsyncClient):
    """Identical rows should be deduplicated (keep first, reject rest)."""
    cols = DIABETES_FEATURES + ["label"]
    row = [100, 80, 25, 45, 100, 30, 2, 0.5, 1]
    rows = [row, row, row]  # 3 identical
    csv_buf = make_csv_bytes(cols, rows)
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("dupes.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["accepted_rows"] == 1  # first kept
    assert body["rejected_rows"] == 2  # two duplicates
    dup_errors = [e for e in body["validation_errors"] if "Duplicate" in e["error"]]
    assert len(dup_errors) == 2


# ---- Unknown disease -------------------------------------------------------

async def test_unknown_disease_rejected(client: AsyncClient):
    """An unrecognised disease ID should return 422."""
    csv_buf = make_diabetes_csv()
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "unknown_disease"},
        files={"file": ("any.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 422
    assert "Unknown disease" in resp.json()["detail"]


# ---- Empty CSV -------------------------------------------------------------

async def test_empty_csv_rejected(client: AsyncClient):
    """A CSV with headers but no data rows should be rejected."""
    cols = DIABETES_FEATURES + ["label"]
    csv_buf = make_csv_bytes(cols, [])
    resp = await client.post(
        UPLOAD_URL,
        data={"disease": "diabetes"},
        files={"file": ("empty.csv", csv_buf, "text/csv")},
    )
    assert resp.status_code == 422
    assert "no data" in resp.json()["detail"].lower()
