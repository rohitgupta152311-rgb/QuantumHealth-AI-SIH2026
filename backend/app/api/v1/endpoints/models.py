"""Model training and management endpoints (v1 extension)."""
import hashlib
import json
import os
import time
from typing import Dict, Any
from pathlib import Path

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sklearn.model_selection import train_test_split, StratifiedKFold
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.datasets.loader import DatasetLoader, get_dataset_loader
from app.models.dataset_models import ModelVersion
from app.models.experiment import ExperimentResult
from app.preprocessing.pipeline import PreprocessingPipeline
from app.classical_ml.trainer import ClassicalMLTrainer
from app.quantum_ml.vqc import QuantumClassifier
from app.schemas.model_schemas import TrainRequest, TrainResponse
from app.services.prediction_service import PredictionService
from app.utils.metrics import evaluate_model, evaluate_model_safe, get_model_comparison

router = APIRouter()

MIN_SAMPLES = 10
METRIC_KEYS = ("accuracy", "precision", "recall", "f1_score", "auc_roc")


def _data_hash(X: np.ndarray, y: np.ndarray) -> str:
    """Compute SHA-256 hash of the training data for versioning."""
    h = hashlib.sha256()
    h.update(np.ascontiguousarray(X).tobytes())
    h.update(np.ascontiguousarray(y).tobytes())
    return h.hexdigest()


def _hybrid_metrics(
    classical_models: Dict[str, Any],
    quantum_model: QuantumClassifier,
    X_classical: np.ndarray,
    X_quantum: np.ndarray,
    y_true: np.ndarray,
) -> Dict[str, Any]:
    """Evaluate the fixed 60/40 classical-quantum blend on one dataset."""
    c_probs = []
    for model in classical_models.values():
        try:
            c_probs.append(model.predict_proba(X_classical)[:, 1])
        except Exception:
            c_probs.append(model.predict(X_classical).astype(float))

    c_mean_proba = np.mean(c_probs, axis=0)
    q_proba = quantum_model.predict_proba(X_quantum)[:, 1]
    hybrid_proba = 0.6 * c_mean_proba + 0.4 * q_proba
    hybrid_pred = (hybrid_proba >= 0.5).astype(int)

    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, roc_auc_score, confusion_matrix,
    )

    try:
        auc_roc = float(roc_auc_score(y_true, hybrid_proba))
    except ValueError:
        auc_roc = None

    return {
        "accuracy": float(accuracy_score(y_true, hybrid_pred)),
        "precision": float(precision_score(y_true, hybrid_pred, zero_division=0)),
        "recall": float(recall_score(y_true, hybrid_pred, zero_division=0)),
        "f1_score": float(f1_score(y_true, hybrid_pred, zero_division=0)),
        "auc_roc": auc_roc,
        "confusion_matrix": confusion_matrix(y_true, hybrid_pred).tolist(),
    }


def _summarize_cv_metrics(fold_metrics: list[Dict[str, Any]]) -> Dict[str, Dict[str, float | None]]:
    """Return mean and standard deviation for the requested CV metric fields."""
    summary: Dict[str, Dict[str, float | None]] = {}
    for metric in METRIC_KEYS:
        values = [m[metric] for m in fold_metrics if m.get(metric) is not None]
        if values:
            summary[metric] = {
                "mean": float(np.mean(values)),
                "std": float(np.std(values, ddof=0)),
            }
        else:
            summary[metric] = {"mean": None, "std": None}
    return summary


def _run_cross_validation(
    disease: str,
    X_train: np.ndarray,
    y_train: np.ndarray,
    feature_names: list[str],
) -> Dict[str, Any]:
    """Run fresh, leakage-free stratified CV on the final-training portion only.

    The final 20% hold-out set is deliberately not passed to this function.
    Fold models are never saved, so they cannot replace production cache files.
    """
    _, class_counts = np.unique(y_train, return_counts=True)
    n_splits = min(5, int(class_counts.min()))
    if n_splits < 2:
        return {
            "available": False,
            "reason": "At least two training samples are required in every class for stratified cross-validation.",
            "n_splits": 0,
            "folds": [],
            "summary": {},
        }

    splitter = StratifiedKFold(
        n_splits=n_splits, shuffle=True, random_state=settings.random_seed
    )
    fold_results: list[Dict[str, Any]] = []

    # High-efficiency stratified sampling for cross-validation on large cohorts
    if len(X_train) > 5000:
        from sklearn.model_selection import StratifiedShuffleSplit
        sss = StratifiedShuffleSplit(n_splits=1, train_size=4000, random_state=settings.random_seed)
        cv_idx, _ = next(sss.split(X_train, y_train))
        cv_X, cv_y = X_train[cv_idx], y_train[cv_idx]
    else:
        cv_X, cv_y = X_train, y_train

    for fold_number, (fold_train_idx, fold_val_idx) in enumerate(
        splitter.split(cv_X, cv_y), start=1
    ):
        # A brand-new pipeline is fitted only on this fold's training rows.
        fold_pipeline = PreprocessingPipeline(
            n_quantum_features=settings.quantum_n_qubits,
            model_version=f"{disease}_cv_fold_{fold_number}",
        )
        fold_pipeline.fit(cv_X[fold_train_idx], cv_y[fold_train_idx], feature_names)
        X_fold_train_classical, X_fold_train_quantum = fold_pipeline.transform(cv_X[fold_train_idx])
        X_fold_val_classical, X_fold_val_quantum = fold_pipeline.transform(cv_X[fold_val_idx])
        y_fold_train = cv_y[fold_train_idx]
        y_fold_val = cv_y[fold_val_idx]

        # Representative validation sample for high-speed evaluation (< 300 rows)
        if len(y_fold_val) > 300:
            val_sub = np.random.RandomState(42).choice(len(y_fold_val), size=300, replace=False)
            val_eval_classical = X_fold_val_classical[val_sub]
            val_eval_quantum = X_fold_val_quantum[val_sub]
            val_eval_y = y_fold_val[val_sub]
        else:
            val_eval_classical = X_fold_val_classical
            val_eval_quantum = X_fold_val_quantum
            val_eval_y = y_fold_val

        # Fresh in-memory classical models
        fold_trainer = ClassicalMLTrainer(disease, settings.models_cache_dir)
        for model in fold_trainer.models.values():
            model.fit(X_fold_train_classical, y_fold_train)

        fold_quantum = QuantumClassifier(
            n_qubits=settings.quantum_n_qubits,
            n_layers=settings.quantum_n_layers,
            n_epochs=min(settings.quantum_vqc_epochs, 25),
            max_training_samples=min(settings.quantum_max_train_samples, 80),
        )
        fold_quantum.fit(X_fold_train_quantum, y_fold_train)

        fold_results.append({
            "fold": fold_number,
            "classical": evaluate_model(
                fold_trainer.models["RandomForest"], val_eval_classical, val_eval_y
            ),
            "quantum": evaluate_model(fold_quantum, val_eval_quantum, val_eval_y),
            "hybrid": _hybrid_metrics(
                fold_trainer.models,
                fold_quantum,
                val_eval_classical,
                val_eval_quantum,
                val_eval_y,
            ),
        })

    return {
        "available": True,
        "n_splits": n_splits,
        "folds": fold_results,
        "summary": {
            model_type: _summarize_cv_metrics(
                [fold[model_type] for fold in fold_results]
            )
            for model_type in ("classical", "quantum", "hybrid")
        },
    }


@router.post("/train", response_model=TrainResponse)
async def train_models(
    request: TrainRequest,
    db: AsyncSession = Depends(get_db),
) -> TrainResponse:
    """
    Train classical, quantum, and hybrid models for a disease module.

    - Uses real local and/or uploaded data.
    - Fits dual-scaler preprocessing pipeline (StandardScaler for classical, MinMaxScaler for quantum).
    - Uses stratified 5-fold cross-validation on training data.
    - Evaluates on a final held-out stratified 20% test set.
    - Saves all trained models, preprocessing pipeline, and model metadata.
    """
    disease = request.disease
    loader = get_dataset_loader()

    if disease not in loader.disease_ids:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown disease '{disease}'. Available: {loader.disease_ids}",
        )

    # ---- Load data (base + uploaded real data) ----
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
    pipeline_path = cache_dir / f"{disease}_pipeline.pkl"

    all_cached = (
        rf_path.exists()
        and svm_path.exists()
        and lr_path.exists()
        and vqc_path.exists()
        and pipeline_path.exists()
    )

    # Held-out stratified train/test split (80/20) with high-efficiency subsampling for large cohorts
    if len(X) > 15000:
        from sklearn.model_selection import StratifiedShuffleSplit
        sss = StratifiedShuffleSplit(n_splits=1, train_size=12000, test_size=3000, random_state=settings.random_seed)
        train_idx, test_idx = next(sss.split(X, y))
        X_train, y_train = X[train_idx], y[train_idx]
        X_test, y_test = X[test_idx], y[test_idx]
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=settings.random_seed, stratify=y
        )

    trainer = ClassicalMLTrainer(disease, cache_dir)
    qc = QuantumClassifier(
        n_qubits=settings.quantum_n_qubits,
        n_layers=settings.quantum_n_layers,
        n_epochs=min(settings.quantum_vqc_epochs, 40),
        max_training_samples=min(settings.quantum_max_train_samples, 100),
    )

    # CV is always calculated from the 80% training portion.  It never sees
    # the final held-out test rows and never writes model-cache files.
    cross_validation = _run_cross_validation(
        disease, X_train, y_train, feature_names
    )

    if all_cached and not request.force_retrain:
        # Load cached pipeline and models
        pipeline = PreprocessingPipeline(n_quantum_features=settings.quantum_n_qubits)
        pipeline.load(pipeline_path)

        X_train_classical, X_train_quantum = pipeline.transform(X_train)
        X_test_classical, X_test_quantum = pipeline.transform(X_test)

        trainer.load_or_train(
            X_train_classical, y_train, X_test_classical, y_test, feature_names
        )
        try:
            qc.load(vqc_path)
        except Exception:
            qc.fit(X_train_quantum, y_train)
            qc.save(vqc_path)

        status_msg = "success (cached models)"
    else:
        # Fit fresh preprocessing pipeline strictly on training data
        pipeline = PreprocessingPipeline(
            n_quantum_features=settings.quantum_n_qubits,
            model_version=f"{disease}_v1.0",
        )
        pipeline.fit(X_train, y_train, feature_names)

        X_train_classical, X_train_quantum = pipeline.transform(X_train)
        X_test_classical, X_test_quantum = pipeline.transform(X_test)

        # Train and cache classical and quantum models
        trainer.train(X_train_classical, y_train, X_test_classical, y_test, feature_names)
        qc.fit(X_train_quantum, y_train)
        qc.save(vqc_path)
        pipeline.save(pipeline_path)

        status_msg = "success"

    # Evaluate best classical model on held-out test set
    rf_model = trainer.models["RandomForest"]
    classical_metrics = evaluate_model(rf_model, X_test_classical, y_test)

    # Use representative test sample (max 1000) for quantum & hybrid evaluation
    if len(y_test) > 1000:
        t_sub = np.random.RandomState(42).choice(len(y_test), size=1000, replace=False)
        test_q_X_c = X_test_classical[t_sub]
        test_q_X_q = X_test_quantum[t_sub]
        test_q_y = y_test[t_sub]
    else:
        test_q_X_c = X_test_classical
        test_q_X_q = X_test_quantum
        test_q_y = y_test

    # Evaluate quantum model on held-out test set
    quantum_metrics = evaluate_model(qc, test_q_X_q, test_q_y)

    # Evaluate the production hybrid model only on the untouched final test set.
    hybrid_metrics = _hybrid_metrics(
        trainer.models, qc, test_q_X_c, test_q_X_q, test_q_y
    )

    comparison = get_model_comparison(classical_metrics, quantum_metrics, hybrid_metrics)

    prep_info = pipeline.get_preprocessing_info()
    training_config = {
        "quantum_n_qubits": settings.quantum_n_qubits,
        "quantum_n_layers": settings.quantum_n_layers,
        "quantum_vqc_epochs": settings.quantum_vqc_epochs,
        "quantum_max_train_samples": settings.quantum_max_train_samples,
        "quantum_backend": settings.quantum_backend,
        "test_size": 0.2,
        "force_retrain": request.force_retrain,
        "selected_quantum_features": prep_info.get("selected_features", []),
        "dataset_rows": data_info["total_rows"],
        "dataset_source": data_info["source"],
        "cross_validation": cross_validation,
    }

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
        metrics_json=json.dumps({
            "metrics": comparison,
            "training_config": training_config,
        }, default=str),
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
        training_config=training_config,
    )
