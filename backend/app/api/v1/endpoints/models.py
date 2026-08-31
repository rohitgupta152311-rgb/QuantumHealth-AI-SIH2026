"""Model training and management endpoints (v1 extension)."""
import hashlib
import json
import os
import time
from typing import Dict, Any
from pathlib import Path

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sklearn.model_selection import train_test_split
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.datasets.loader import DatasetLoader, get_dataset_loader
from app.models.dataset_models import ModelVersion
from app.models.experiment import ExperimentResult
from app.preprocessing.pipeline import PreprocessingPipeline
from app.classical_ml.trainer import ClassicalMLTrainer
from app.quantum_ml.vqc import QuantumClassifier
from app.schemas.model_schemas import TrainRequest, TrainResponse, ModelComparisonResponse
from app.services.prediction_service import PredictionService
from app.utils.metrics import evaluate_model, evaluate_model_safe, get_model_comparison

router = APIRouter()

MIN_SAMPLES = 10


def _data_hash(X: np.ndarray, y: np.ndarray) -> str:
    """Compute SHA-256 hash of the training data for versioning."""
    h = hashlib.sha256()
    h.update(np.ascontiguousarray(X).tobytes())
    h.update(np.ascontiguousarray(y).tobytes())
    return h.hexdigest()


@router.post("/train", response_model=TrainResponse)
async def train_models(
    request: TrainRequest,
    db: AsyncSession = Depends(get_db),
) -> TrainResponse:
    """
    Train classical, quantum, and hybrid models for a disease.

    Uses base + uploaded data. Set `force_retrain=true` to retrain even if
    cached models exist. All reported metrics are evaluated on a held-out
    stratified test set. No artificial metric improvements are applied.
    """
    disease = request.disease
    loader = get_dataset_loader()

    if disease not in loader.disease_ids:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown disease '{disease}'. Available: {loader.disease_ids}",
        )

    # ---- Load data (base + uploaded) ----
    X, y, feature_names, data_info = await loader.load_with_uploads(disease, db)

    if len(X) < MIN_SAMPLES:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient data: {len(X)} samples (minimum {MIN_SAMPLES}).",
        )

    unique_labels = np.unique(y)
    if len(unique_labels) < 2:
        raise HTTPException(
            status_code=422,
            detail=f"Only one class present (label={int(unique_labels[0])}). "
            "Need both 0 and 1 labels for training.",
        )

    cache_dir = settings.models_cache_dir
    os.makedirs(str(cache_dir), exist_ok=True)

    rf_path = cache_dir / f"{disease}_RandomForest.pkl"
    svm_path = cache_dir / f"{disease}_SVM.pkl"
    lr_path = cache_dir / f"{disease}_LogisticRegression.pkl"
    vqc_path = cache_dir / f"{disease}_vqc.pkl"

    all_cached = rf_path.exists() and svm_path.exists() and lr_path.exists() and vqc_path.exists()

    # Stratified split for training/evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = PreprocessingPipeline(n_quantum_features=settings.quantum_n_qubits)
    pipeline.fit(X_train, y_train, feature_names)

    X_train_clean = pipeline.cleaner.transform(X_train)
    X_train_norm = pipeline.normalizer.transform(X_train_clean)
    X_train_quantum = pipeline.selector.transform(X_train_norm)

    X_test_clean = pipeline.cleaner.transform(X_test)
    X_test_norm = pipeline.normalizer.transform(X_test_clean)
    X_test_quantum = pipeline.selector.transform(X_test_norm)

    trainer = ClassicalMLTrainer(disease, cache_dir)
    qc = QuantumClassifier(n_qubits=settings.quantum_n_qubits, n_layers=settings.quantum_n_layers)

    if all_cached and not request.force_retrain:
        # Load cached classical models and evaluate
        trainer.load_or_train(X_train_norm, y_train, X_test_norm, y_test, feature_names)
        try:
            qc.load(str(vqc_path))
        except Exception:
            qc.fit(X_train_quantum, y_train)
            qc.save(str(vqc_path))

        status_msg = "success (cached models)"
    else:
        # Train fresh models
        trainer.train(X_train_norm, y_train, X_test_norm, y_test, feature_names)
        qc.fit(X_train_quantum, y_train)
        qc.save(str(vqc_path))
        status_msg = "success"

    # Evaluate best classical model
    rf_model = trainer.models["RandomForest"]
    classical_metrics = evaluate_model(rf_model, X_test_norm, y_test)

    # Evaluate quantum model
    quantum_metrics = evaluate_model(qc, X_test_quantum, y_test)

    # Evaluate hybrid model (60% Classical Ensemble + 40% VQC)
    c_probs = []
    for m in trainer.models.values():
        try:
            p = m.predict_proba(X_test_norm)[:, 1]
        except Exception:
            p = m.predict(X_test_norm).astype(float)
        c_probs.append(p)
    c_mean_proba = np.mean(c_probs, axis=0)
    q_proba = qc.predict_proba(X_test_quantum)[:, 1]

    hybrid_proba = 0.6 * c_mean_proba + 0.4 * q_proba
    hybrid_pred = (hybrid_proba >= 0.5).astype(int)

    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, roc_auc_score, confusion_matrix
    )

    hybrid_acc = float(accuracy_score(y_test, hybrid_pred))
    hybrid_prec = float(precision_score(y_test, hybrid_pred, zero_division=0))
    hybrid_rec = float(recall_score(y_test, hybrid_pred, zero_division=0))
    hybrid_f1 = float(f1_score(y_test, hybrid_pred, zero_division=0))
    try:
        hybrid_auc = float(roc_auc_score(y_test, hybrid_proba))
    except ValueError:
        hybrid_auc = 0.0
    hybrid_cm = confusion_matrix(y_test, hybrid_pred).tolist()

    hybrid_metrics = {
        'accuracy': round(hybrid_acc, 4),
        'precision': round(hybrid_prec, 4),
        'recall': round(hybrid_rec, 4),
        'f1_score': round(hybrid_f1, 4),
        'auc_roc': round(hybrid_auc, 4),
        'confusion_matrix': hybrid_cm
    }

    comparison = get_model_comparison(classical_metrics, quantum_metrics, hybrid_metrics)

    # ---- Save model version & experiment ----
    d_hash = _data_hash(X, y)
    model_version = ModelVersion(
        disease_id=disease,
        data_hash=d_hash,
        metrics_json=json.dumps(comparison, default=str),
        model_path=str(rf_path),
    )
    db.add(model_version)
    await db.flush()

    experiment = ExperimentResult(
        disease=disease,
        model_type="hybrid",
        metrics_json=json.dumps(comparison, default=str),
    )
    db.add(experiment)
    await db.commit()
    await db.refresh(model_version)
    await db.refresh(experiment)

    return TrainResponse(
        status=status_msg,
        disease=disease,
        metrics=comparison,
        experiment_id=experiment.id,
        model_version_id=model_version.id,
        data_hash=d_hash,
        data_info=data_info,
    )
