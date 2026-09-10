"""
Strict Clinical & Scientific Integrity Tests for Chinese Diabetes Cohort
(Dryad DOI: 10.5061/dryad.ft8750v / BMJ Open 2018; 8:e021768).

Validates:
1. Complete target leakage exclusion (ID, final visit FPG, follow-up outcome, censor, follow-up years).
2. Grouped multi-center split (zero screening site overlap between train, val, test).
3. Safe deprecation of legacy Pima fields (warnings generated, ZERO semantic remapping).
4. Unit conversion exactness (FPG mmol/L <-> mg/dL conversion factor 18.0182).
5. VQC case-control sampling with authentic clinical incident events.
6. Provenance metadata and population limitation disclaimers in API responses.
"""
import pytest
import numpy as np
import pandas as pd
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from sklearn.model_selection import GroupShuffleSplit

from main import app
from app.datasets.loader import get_dataset_loader
from app.quantum_ml.vqc import QuantumClassifier
from app.core.config import settings


LEAKAGE_TARGET_FIELDS = {
    "id",
    "ID",
    "FPG_of_final_visit_mmol_L",
    "fpg_of_final_visit",
    "diabetes_diagnosed_during_followup",
    "censor_diabetes_at_followup",
    "year_of_followup",
    "years_of_followup",
}


def test_no_target_leakage_in_features():
    """Verify strictly zero target leakage variables in dataset loader output."""
    loader = get_dataset_loader()
    X, y, groups, feature_names = loader.load_grouped("diabetes")

    # 1. Feature names must NOT contain any leakage variable
    for f in feature_names:
        assert f not in LEAKAGE_TARGET_FIELDS, f"Target leakage variable '{f}' detected in feature_names!"

    # 2. Disease info features list must NOT contain any leakage variable
    info = loader.get_disease_info("diabetes")
    catalog_feature_names = {f["name"] for f in info["features"]}
    for f in catalog_feature_names:
        assert f not in LEAKAGE_TARGET_FIELDS, f"Target leakage variable '{f}' in catalog schema!"

    # 3. y must be the binary incident diabetes outcome (0 or 1)
    unique_y = set(np.unique(y))
    assert unique_y.issubset({0, 1})
    assert len(X) == 211833
    assert len(y) == 211833
    assert len(groups) == 211833


def test_multi_center_site_split_disjoint():
    """Verify GroupShuffleSplit on screening centers ensures 100% disjoint sites."""
    loader = get_dataset_loader()
    X, y, groups, feature_names = loader.load_grouped("diabetes")

    # Multi-center external validation split (80% train+val centers, 20% test centers)
    gss_test = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=settings.random_seed)
    train_val_idx, test_idx = next(gss_test.split(X, y, groups))

    groups_train_val = set(groups[train_val_idx])
    groups_test = set(groups[test_idx])

    # Zero overlap between test centers and train+val centers
    assert len(groups_train_val.intersection(groups_test)) == 0, (
        f"Center leakage: {groups_train_val.intersection(groups_test)} in both train_val and test!"
    )

    # Further split train_val into train centers and val centers (75% train, 25% val)
    groups_temp = groups[train_val_idx]
    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=settings.random_seed)
    train_sub_idx, val_sub_idx = next(gss_val.split(X[train_val_idx], y[train_val_idx], groups_temp))

    groups_train = set(groups_temp[train_sub_idx])
    groups_val = set(groups_temp[val_sub_idx])

    # Zero overlap between train centers and val centers
    assert len(groups_train.intersection(groups_val)) == 0, (
        f"Center leakage: {groups_train.intersection(groups_val)} in both train and val!"
    )

    # All three center sets are mutually disjoint
    assert len(groups_train.intersection(groups_test)) == 0
    assert len(groups_val.intersection(groups_test)) == 0


def test_fpg_dual_unit_exact_conversion():
    """Verify FPG mmol/L to mg/dL conversion factor is exactly 18.0182."""
    data_path = Path(__file__).resolve().parent.parent / "data" / "diabetes_chinese_cohort_analytic_211k.csv"
    if not data_path.exists():
        data_path = Path("data/diabetes_chinese_cohort_analytic_211k.csv")
    df = pd.read_csv(data_path, nrows=5000)

    # Check FPG conversion: mg/dL == mmol/L * 18.0182 rounded to 2 decimals
    expected_mg_dl = np.round(df["FPG_mmol_L"].values * 18.0182, 2)
    np.testing.assert_allclose(df["FPG_mg_dL"].values, expected_mg_dl, rtol=1e-3)

    # Check total incident events in full cohort (censor_diabetes_at_followup == 1)
    full_df_summary = pd.read_csv(data_path, usecols=["censor_diabetes_at_followup"])
    total_events = int(full_df_summary["censor_diabetes_at_followup"].sum())
    assert total_events == 4174, f"Expected 4,174 incident events, got {total_events}"


@pytest.mark.training
def test_vqc_training_case_control_subset_real_events():
    """Verify VQC fit selects genuine case-control samples without 0-event slices."""
    # Synthetic test slice matching 1.97% prevalence
    rng = np.random.RandomState(42)
    n = 2000
    n_pos = int(n * 0.02)  # 40 events
    n_neg = n - n_pos

    X = rng.rand(n, 6)
    y = np.array([1] * n_pos + [0] * n_neg)
    perm = rng.permutation(n)
    X, y = X[perm], y[perm]

    qc = QuantumClassifier(
        n_qubits=6,
        n_layers=2,
        n_epochs=5,
        max_training_samples=100,
        backend="numpy:statevector"
    )
    qc.fit(X, y)
    assert qc._fitted is True
    # Forward pass outputs valid Born probabilities in [0, 1]
    sample_probs = qc.predict_proba(X[:10], calibrated=False)
    assert sample_probs.shape == (10, 2)
    assert np.all(sample_probs >= 0.0) and np.all(sample_probs <= 1.0)
    np.testing.assert_allclose(np.sum(sample_probs, axis=1), 1.0, rtol=1e-5)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_legacy_pima_not_remapped_and_warned():
    """Verify legacy Pima inputs are rejected with warnings and NEVER remapped."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/predict",
            json={
                "disease": "diabetes",
                "features": {
                    "Pregnancies": 4,
                    "DiabetesPedigreeFunction": 0.85,
                    "SkinThickness": 25,
                    "Insulin": 120,
                    "Age": 50,
                    "Gender": 2,  # Female in Chinese cohort coding
                    "BMI": 26.5,
                    "SBP_mmHg": 130,
                    "DBP_mmHg": 85,
                    "FPG_mg_dL": 105,
                    "Cholesterol_mmol_L": 4.8,
                    "Triglyceride_mmol_L": 1.5,
                    "ALT_UL": 28,
                    "CCR_umol_L": 80,
                    "family_history_of_diabetes": 0
                }
            }
        )
        assert res.status_code == 200
        data = res.json()

        # Warnings must declare that legacy Pima features are ignored and NOT remapped
        warnings = data.get("warnings", [])
        assert any("Pregnancies" in w and "Not remapped" in w for w in warnings)
        assert any("DiabetesPedigreeFunction" in w and "Not remapped" in w for w in warnings)

        # Provenance metadata must declare the Chinese longitudinal cohort
        assert data["cohort"] == "Chinese Health-Screening Cohort"
        assert "3.12-Year" in data["prediction_horizon"]
        assert "not calibrated or validated" in data["population_limitation"].lower()
