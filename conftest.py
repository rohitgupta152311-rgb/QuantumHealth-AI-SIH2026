"""Repository-wide test policy: no training or production cache writes by default."""
import os
import sys
import tempfile

import pytest

# Apply before nested conftests import the application. Never use live cloud credentials.
_qa_cache = tempfile.TemporaryDirectory(prefix="quantumhealth_qa_")
os.environ["AUTO_TRAIN_MISSING_MODELS"] = "false"
os.environ["FIREBASE_ENABLED"] = "false"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
if "--run-integration" not in sys.argv:
    os.environ["MODELS_CACHE_DIR"] = _qa_cache.name


def pytest_addoption(parser):
    parser.addoption("--run-training", action="store_true", help="Explicitly allow model-training tests")
    parser.addoption("--run-integration", action="store_true", help="Use existing trusted model artifacts for integration tests")


def pytest_configure(config):
    if not config.getoption("--run-integration"):
        os.environ["MODELS_CACHE_DIR"] = _qa_cache.name


def pytest_collection_modifyitems(config, items):
    selected, excluded = [], []
    for item in items:
        blocked = any(item.get_closest_marker(marker) and not config.getoption(option) for marker, option in (
            ("training", "--run-training"), ("integration", "--run-integration"),
        ))
        (excluded if blocked else selected).append(item)
    items[:] = selected
    config.hook.pytest_deselected(items=excluded)


@pytest.fixture(autouse=True)
def prevent_implicit_training(request, monkeypatch):
    if request.config.getoption("--run-training") and request.node.get_closest_marker("training"):
        return
    from app.classical_ml.trainer import ClassicalMLTrainer
    from app.quantum_ml.vqc import QuantumClassifier
    from app.classical_ml.random_forest import RandomForestModel
    from app.classical_ml.svm import SVMModel
    from app.classical_ml.logistic_regression import LogisticRegressionModel
    from app.classical_ml.gradient_boosting import GradientBoostingModel
    from app.classical_ml.xgboost_model import XGBoostModel
    from app.hybrid_ml.hybrid_ensemble import HybridEnsemble

    def forbidden(*args, **kwargs):
        pytest.fail("Model training attempted without a training marker and --run-training")

    monkeypatch.setattr(ClassicalMLTrainer, "train", forbidden)
    monkeypatch.setattr(HybridEnsemble, "fit_alpha_cv", forbidden)
    monkeypatch.setattr(HybridEnsemble, "fit_calibrator", forbidden)
    for model in (QuantumClassifier, RandomForestModel, SVMModel, LogisticRegressionModel, GradientBoostingModel, XGBoostModel):
        monkeypatch.setattr(model, "fit", forbidden)
