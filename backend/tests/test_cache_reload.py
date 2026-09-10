"""Serialize deterministic checkpoint state without fitting or touching real artifacts."""
import hashlib
import json
from types import SimpleNamespace
from unittest.mock import Mock

import joblib
import numpy as np
import pytest

from app.classical_ml.trainer import ClassicalMLTrainer
from app.core.config import settings
from app.hybrid_ml.hybrid_ensemble import HybridEnsemble
from app.hybrid_ml.consensus import ConsensusEngine
from app.services.inference_engine import InferenceEngine
from app.services.training_orchestrator import TrainingOrchestrator


class FixedClassifier:
    def predict(self, x):
        return np.zeros(len(x))

    def predict_proba(self, x):
        return np.tile([0.8, 0.2], (len(x), 1))


class SavedCalibrator:
    def predict(self, x):
        return (self.predict_proba(x)[:, 1] >= 0.5).astype(int)

    def predict_proba(self, x):
        p = np.clip(np.asarray(x)[:, 0] * 0.5 + 0.1, 0, 1)
        return np.column_stack([1 - p, p])


class FixedQuantum:
    def predict_proba_single(self, x, calibrated=True):
        return 0.6


class SavedPipeline:
    def __init__(self, **kwargs):
        pass

    def load(self, path):
        assert path.read_bytes() == b"deterministic preprocessing checkpoint"

    def transform_single(self, values, names):
        x = np.array([[values[name] for name in names]])
        return x, x

    def transform(self, x):
        return x, x


@pytest.fixture
def checkpoint(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "auto_train_missing_models", False)
    monkeypatch.setattr("app.services.training_orchestrator.PreprocessingPipeline", SavedPipeline)
    pipeline = tmp_path / "heart_pipeline.pkl"
    pipeline.write_bytes(b"deterministic preprocessing checkpoint")
    digest = hashlib.sha256(pipeline.read_bytes()).hexdigest()
    hybrid = HybridEnsemble(alpha=0.9)
    hybrid.calibrator = SavedCalibrator()
    hybrid._fitted = True
    bundle = dict(disease_id="heart", models={"saved_model": FixedClassifier()},
                  vqc_model=FixedQuantum(), hybrid_ensemble=hybrid,
                  calibrators={"saved_model": SavedCalibrator()}, alpha_star=0.9,
                  abstention_threshold=0.7, feature_names=["age"], preprocessing_hash=digest, data_hashes={})
    manifest = dict(disease_id="heart", preprocessing_artifact_sha256=digest,
                    test_metrics_summary=[{"model": "saved_model", "accuracy": 0.8}], manifest_sha256="test-manifest")
    joblib.dump(bundle, tmp_path / "heart_bundle.pkl")
    (tmp_path / "heart_manifest.json").write_text(json.dumps(manifest))
    loader = Mock()
    loader.get_disease_info.return_value = {"features": [{"name": "age"}]}
    return tmp_path, pipeline, bundle, manifest, loader


@pytest.mark.asyncio
@pytest.mark.parametrize("threshold", [0.7, 0.1])
async def test_reload_preserves_predictions_and_abstention(checkpoint, threshold):
    directory, pipeline_path, bundle, manifest, loader = checkpoint
    bundle["abstention_threshold"] = threshold
    joblib.dump(bundle, directory / "heart_bundle.pkl")
    before = ClassicalMLTrainer("heart", directory)
    before.models = bundle["models"]
    before.calibrators = bundle["calibrators"]
    before.hybrid_ensemble = bundle["hybrid_ensemble"]
    before.abstention_disagreement_threshold = threshold
    before._manifest = manifest
    before._trained = True
    engine = InferenceEngine(ConsensusEngine(), SimpleNamespace(quantum_n_qubits=1), directory)
    args = ("heart", {"age": 0.2}, loader.get_disease_info.return_value)
    expected = engine.predict_single(*args, before, SavedPipeline(), bundle["vqc_model"])
    loaded = await TrainingOrchestrator(loader, directory).get_or_train_models("heart")
    actual = engine.predict_single(*args, loaded.trainer, loaded.pipeline, loaded.vqc_model)
    for result in (expected, actual):
        result.pop("q_time", None)
        result.pop("X_classical", None)
        result.pop("X_quantum", None)
    assert actual == expected
    assert loaded.trainer.alpha_star == 0.9
    assert loaded.trainer.abstention_disagreement_threshold == threshold
    assert loaded.trainer.get_manifest() == manifest
    assert loaded.trainer.get_model_metrics() == manifest["test_metrics_summary"]
    assert set(loaded.trainer.models) == {"saved_model"}  # Not today's constructor defaults.
    assert loaded.trainer.hybrid_ensemble.calibrator is not None
    assert actual["status"] == ("completed" if threshold == 0.7 else "abstained")
    if threshold == 0.7:
        assert actual["hybrid_prob"] == pytest.approx(0.38)
        assert actual["hybrid_prob"] != pytest.approx(0.6 * 0.2 + 0.4 * 0.6)
    loader.load.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("damage", ["hybrid_ensemble", "abstention_threshold", "manifest", "preprocessing", "disease", "schema"])
async def test_rejects_incomplete_or_mismatched_cache_without_training(checkpoint, damage):
    directory, pipeline, bundle, manifest, loader = checkpoint
    if damage in ("hybrid_ensemble", "abstention_threshold"):
        del bundle[damage]
    elif damage == "manifest":
        (directory / "heart_manifest.json").unlink()
    elif damage == "preprocessing":
        pipeline.write_bytes(b"different pipeline")
    elif damage == "disease":
        bundle["disease_id"] = "kidney"
    elif damage == "schema":
        bundle["feature_names"] = ["unexpected"]
    joblib.dump(bundle, directory / "heart_bundle.pkl")
    with pytest.raises(RuntimeError, match="Automatic training is disabled"):
        await TrainingOrchestrator(loader, directory).get_or_train_models("heart")
    loader.load.assert_not_called()


def test_failed_load_does_not_partially_mutate_trainer(checkpoint):
    directory, pipeline, bundle, manifest, loader = checkpoint
    trainer = ClassicalMLTrainer("heart", directory)
    original_models = trainer.models
    pipeline.write_bytes(b"wrong preprocessing")
    with pytest.raises(ValueError, match="Preprocessing"):
        trainer.load_cached(pipeline)
    assert trainer.models is original_models
    assert not trainer._trained


def test_restores_full_metrics_when_available(checkpoint):
    directory, pipeline, bundle, manifest, loader = checkpoint
    bundle["metrics"] = [{"model_name": "saved_model", "precision": 0.75}]
    joblib.dump(bundle, directory / "heart_bundle.pkl")
    trainer = ClassicalMLTrainer("heart", directory)
    trainer.load_cached(pipeline)
    assert trainer.get_model_metrics() == bundle["metrics"]


@pytest.mark.asyncio
async def test_abbreviated_manifest_metrics_do_not_break_comparison(checkpoint):
    from app.schemas.comparison import ModelMetrics
    from app.services.prediction_service import PredictionService

    directory, pipeline, bundle, manifest, loader = checkpoint
    loader.load.return_value = (np.full((40, 1), 0.2), np.tile([0, 1], 20), ["age"])
    service = PredictionService(loader, directory)
    comparison = await service.get_model_comparison("heart")
    classical = [m for m in comparison["models"] if m["model_type"] == "classical"]
    assert len(classical) == 1
    validated = ModelMetrics.model_validate(classical[0])
    assert validated.model_name == "saved_model"
    assert validated.accuracy == 0.5  # Computed from eight balanced held-out fixtures.
    assert validated.accuracy != manifest["test_metrics_summary"][0]["accuracy"]
