import pytest
import numpy as np
from app.classical_ml.random_forest import RandomForestModel
from app.classical_ml.svm import SVMModel
from app.classical_ml.logistic_regression import LogisticRegressionModel
from app.classical_ml.evaluator import compute_metrics

def test_random_forest(dummy_data):
    X, y, _ = dummy_data
    model = RandomForestModel(n_estimators=10)
    model.fit(X, y)
    
    preds = model.predict(X)
    assert preds.shape == y.shape
    
    probs = model.predict_proba(X)
    assert probs.shape == (len(y), 2)

def test_svm(dummy_data):
    X, y, _ = dummy_data
    model = SVMModel()
    model.fit(X, y)
    
    preds = model.predict(X)
    assert preds.shape == y.shape

def test_logistic_regression(dummy_data):
    X, y, _ = dummy_data
    model = LogisticRegressionModel()
    model.fit(X, y)
    
    preds = model.predict(X)
    assert preds.shape == y.shape

def test_compute_metrics(dummy_data):
    X, y, _ = dummy_data
    model = RandomForestModel(n_estimators=10)
    model.fit(X, y)
    
    metrics = compute_metrics(model, X, y, "test_rf")
    
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "f1_score" in metrics
    assert metrics["model_name"] == "test_rf"
