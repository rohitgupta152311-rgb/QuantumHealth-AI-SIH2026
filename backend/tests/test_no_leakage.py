"""
Tests verifying data leakage prevention and 60/20/20 train/validation/test evaluation protocol.
"""
import numpy as np
import pytest
from pathlib import Path
from sklearn.model_selection import train_test_split

from app.preprocessing.cleaner import DataCleaner
from app.preprocessing.pipeline import PreprocessingPipeline
from app.classical_ml.trainer import ClassicalMLTrainer
from app.datasets.loader import get_dataset_loader


def test_cleaner_masks_sentinels_without_distorting_mean():
    """Verify missing sentinels (e.g. 0.0 for glucose) are masked to NaN before fitting imputer and mean."""
    # Column 0 has valid values [100, 120, 140] and missing sentinel 0.0
    X = np.array([
        [100.0, 50.0],
        [120.0, 60.0],
        [140.0, 70.0],
        [0.0,   80.0],  # 0.0 is a missing sentinel for col 0
    ])
    cleaner = DataCleaner(strategy="median", missing_sentinels={0: [0.0]})
    cleaner.fit(X)

    # Median of col 0 should be median(100, 120, 140) = 120, NOT median(0, 100, 120, 140) = 110!
    assert cleaner.imputer.statistics_[0] == 120.0

    # Transforming data with sentinel 0 should impute it with 120.0
    X_test = np.array([[0.0, 50.0]])
    X_clean = cleaner.transform(X_test)
    assert X_clean[0, 0] == 120.0


def test_pipeline_fits_strictly_on_training_data():
    """Verify PreprocessingPipeline parameters are derived solely from training split."""
    np.random.seed(42)
    n = 100
    X = np.random.randn(n, 8) * 10 + 50
    y = (X[:, 0] > 50).astype(int)
    feature_names = [f"f_{i}" for i in range(8)]

    # 60/20/20 split
    X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

    assert len(X_train) == 60
    assert len(X_val) == 20
    assert len(X_test) == 20

    pipeline = PreprocessingPipeline(n_quantum_features=6)
    pipeline.fit(X_train, y_train, feature_names)

    # Check scaler means equal training data means, not full X means
    np.testing.assert_allclose(
        pipeline.normalizer_classical.scaler.mean_,
        np.mean(pipeline.cleaner.transform(X_train), axis=0),
        rtol=1e-5
    )

    # Transform test set without fitting
    X_test_c, X_test_q = pipeline.transform(X_test)
    assert X_test_c.shape == (20, 8)
    assert X_test_q.shape == (20, 6)
    assert np.all(X_test_q >= 0.0) and np.all(X_test_q <= 1.0)


@pytest.mark.training
def test_platt_calibration_fitted_on_validation_split(tmp_path: Path):
    """Verify ClassicalMLTrainer fits base models on train, Platt calibrates on val, evaluates on test."""
    loader = get_dataset_loader()
    X, y, feature_names = loader.load("diabetes")
    X, y = X[:300], y[:300]

    X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

    pipeline = PreprocessingPipeline(n_quantum_features=6)
    pipeline.fit(X_train, y_train, feature_names)

    X_train_c, _ = pipeline.transform(X_train)
    X_val_c, _ = pipeline.transform(X_val)
    X_test_c, _ = pipeline.transform(X_test)

    trainer = ClassicalMLTrainer("diabetes", tmp_path)
    metrics = trainer.train(
        X_train_c, y_train, X_test_c, y_test, feature_names,
        X_val=X_val_c, y_val=y_val
    )

    assert len(metrics) == len(trainer.models)
    for m in metrics:
        assert m["is_calibrated"] is True
        assert "brier_score" in m
        assert "sensitivity" in m
        assert "specificity" in m
        assert "pr_auc" in m

    # Verify manifest JSON was created with hashes
    manifest = trainer.get_manifest()
    assert manifest["disease_id"] == "diabetes"
    assert "manifest_sha256" in manifest
    assert manifest["split_sizes"]["validation_samples"] == len(X_val)
    assert (tmp_path / "diabetes_manifest.json").exists()
