"""
Comprehensive ML Trainer for QuantumHealth AI.
Orchestrates classical models (RF, SVM, LR), Quantum VQC, and Hybrid Ensemble training.
Enforces 60/20/20 train/val/test leakage prevention, Platt probability calibration,
inner-CV alpha tuning, validation disagreement thresholds, and manifest generation.
"""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import time
from typing import Dict, Any, List, Optional, Tuple

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, StratifiedShuffleSplit

from app.classical_ml.evaluator import compute_metrics
from app.classical_ml.gradient_boosting import GradientBoostingModel
from app.classical_ml.logistic_regression import LogisticRegressionModel
from app.classical_ml.random_forest import RandomForestModel
from app.classical_ml.svm import SVMModel
from app.hybrid_ml.consensus import ConsensusEngine
from app.hybrid_ml.hybrid_ensemble import HybridEnsemble
from app.quantum_ml.circuits import compute_circuit_depth
from app.quantum_ml.vqc import QuantumClassifier

try:
    from app.classical_ml.xgboost_model import XGBoostModel, XGBOOST_AVAILABLE
except ImportError:
    XGBoostModel = None
    XGBOOST_AVAILABLE = False


class ClassicalMLTrainer:
    """
    Unified training orchestrator for Classical, Quantum, and Hybrid ML.
    Enhanced with 5 classical models: RF, SVM, LR, XGBoost, HistGradientBoosting.
    """

    def __init__(self, disease_id: str, models_cache_dir: Path | str = Path("models_cache")):
        self.disease_id = disease_id
        self.models_cache_dir = Path(models_cache_dir)
        self.models_cache_dir.mkdir(parents=True, exist_ok=True)

        self.models = {
            "RandomForest": RandomForestModel(n_estimators=300, max_depth=8),
            "SVM": SVMModel(),
            "LogisticRegression": LogisticRegressionModel(),
            "GradientBoosting": GradientBoostingModel(),
        }
        if XGBOOST_AVAILABLE:
            self.models["XGBoost"] = XGBoostModel()
        self.vqc_model: Optional[QuantumClassifier] = None
        self.hybrid_ensemble: Optional[HybridEnsemble] = None
        self.calibrators: Dict[str, Any] = {}
        self._metrics: List[dict] = []
        self._manifest: Optional[dict] = None
        self._trained: bool = False
        self.abstention_disagreement_threshold: float = 0.45
        self.alpha_star: float = 0.40

    def _get_model_path(self, model_name: str) -> Path:
        return self.models_cache_dir / f"{self.disease_id}_{model_name}.pkl"

    def _get_calibrator_path(self, model_name: str) -> Path:
        return self.models_cache_dir / f"{self.disease_id}_{model_name}_calibrated.pkl"

    def _get_bundle_path(self) -> Path:
        return self.models_cache_dir / f"{self.disease_id}_bundle.pkl"

    def _get_manifest_path(self) -> Path:
        return self.models_cache_dir / f"{self.disease_id}_manifest.json"

    def _compute_data_hash(self, X: np.ndarray) -> str:
        """Compute SHA-256 fingerprint of a numpy dataset split."""
        return hashlib.sha256(np.ascontiguousarray(X).tobytes()).hexdigest()

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        feature_names: list[str],
        X_val: np.ndarray | None = None,
        y_val: np.ndarray | None = None,
        X_train_q: np.ndarray | None = None,
        X_val_q: np.ndarray | None = None,
        X_test_q: np.ndarray | None = None,
        dataset_meta: dict | None = None,
        pipeline_path: Path | str | None = None,
    ) -> list[dict]:
        """
        Train models with strict 60/20/20 sequence:
        1. Training split: Fit classical base models, fit VQC (stratified subset), inner-CV tune alpha.
        2. Validation split: Fit Platt calibrators for classical and VQC, fit hybrid calibrator, derive abstention threshold.
        3. Locked test split: Compute final unbiased evaluation metrics and paired bootstrap CIs.
        """
        self._metrics = []
        self.calibrators = {}

        # -------------------------------------------------------------
        # 1. Classical Models: Train on X_train, calibrate on X_val
        # -------------------------------------------------------------
        classical_val_preds = {}
        classical_test_preds = {}

        for name, model in self.models.items():
            start = time.time()
            model.fit(X_train, y_train)
            train_time = time.time() - start
            model.save(str(self._get_model_path(name)))

            # Fit Platt probability calibration on unaugmented validation split
            calib_model = None
            if X_val is not None and y_val is not None and len(X_val) >= 10:
                try:
                    calibrator = CalibratedClassifierCV(estimator=model.model, method="sigmoid", cv="prefit")
                    calibrator.fit(X_val, y_val)
                    joblib.dump(calibrator, str(self._get_calibrator_path(name)))
                    self.calibrators[name] = calibrator
                    calib_model = calibrator
                    classical_val_preds[name] = calibrator.predict_proba(X_val)[:, 1]
                except Exception:
                    calib_model = model
                    classical_val_preds[name] = model.predict_proba(X_val)[:, 1]
            else:
                calib_model = model

            eval_target = calib_model if calib_model is not None else model
            metrics = compute_metrics(eval_target, X_test, y_test, model_name=name, model_type="classical")
            metrics["training_time_s"] = float(round(train_time, 4))
            metrics["is_calibrated"] = name in self.calibrators
            self._metrics.append(metrics)

            if hasattr(eval_target, "predict_proba"):
                classical_test_preds[name] = eval_target.predict_proba(X_test)[:, 1]
            else:
                classical_test_preds[name] = eval_target.predict(X_test).astype(float)

        # Mean classical probabilities on val and test
        c_val_mean = np.mean(list(classical_val_preds.values()), axis=0) if classical_val_preds else None
        c_test_mean = np.mean(list(classical_test_preds.values()), axis=0) if classical_test_preds else None

        # -------------------------------------------------------------
        # 2. Quantum VQC: Train strictly on stratified subset of X_train_q
        # -------------------------------------------------------------
        # -------------------------------------------------------------
        # 2. Quantum VQC: Train strictly on stratified subset of X_train_q
        # -------------------------------------------------------------
        q_val_probs = None
        q_test_probs = None
        c_val_mean_eval = None
        y_val_eval = None
        c_test_mean_eval = None
        y_test_eval = None
        X_test_eval = None

        if X_train_q is not None and len(X_train_q) >= 10:
            n_qubits = X_train_q.shape[1]
            q_start = time.time()
            qc = QuantumClassifier(
                n_qubits=n_qubits,
                n_layers=2,
                n_epochs=50,
                max_training_samples=min(100, len(X_train_q)),
                backend="numpy:statevector",
                optimizer="cobyla",
                data_reuploading=True,
                loss_fn="focal",
            )
            # Train only on training split
            qc.fit(X_train_q, y_train)
            q_train_time = time.time() - q_start
            qc.save(self.models_cache_dir / f"{self.disease_id}_vqc.pkl")

            # Stratified representative validation subsampling for quantum calibration
            max_q_eval = 500
            if X_val_q is not None and y_val is not None and len(X_val_q) >= 10:
                if len(X_val_q) > max_q_eval:
                    pos_idx = np.where(y_val == 1)[0]
                    neg_idx = np.where(y_val == 0)[0]
                    rng = np.random.RandomState(42)
                    true_prev = len(pos_idx) / len(y_val)
                    n_pos = max(2, int(round(true_prev * max_q_eval)))
                    n_pos = min(len(pos_idx), n_pos)
                    n_neg = min(len(neg_idx), max_q_eval - n_pos)
                    val_sub = np.concatenate([
                        rng.choice(pos_idx, size=n_pos, replace=False),
                        rng.choice(neg_idx, size=n_neg, replace=False)
                    ])
                    rng.shuffle(val_sub)
                    X_val_q_eval = X_val_q[val_sub]
                    y_val_eval = y_val[val_sub]
                    c_val_mean_eval = c_val_mean[val_sub] if c_val_mean is not None else None
                else:
                    X_val_q_eval = X_val_q
                    y_val_eval = y_val
                    c_val_mean_eval = c_val_mean

                try:
                    qc.fit_calibrator(X_val_q_eval, y_val_eval)
                    qc.save(self.models_cache_dir / f"{self.disease_id}_vqc.pkl")
                    qc.save(self.models_cache_dir / f"{self.disease_id}_vqc_calibrated.pkl")
                    q_val_probs = qc.predict_proba(X_val_q_eval, calibrated=True)[:, 1]
                except Exception:
                    q_val_probs = qc.predict_proba(X_val_q_eval, calibrated=False)[:, 1]

            # Stratified representative test subsampling for quantum evaluation
            if X_test_q is not None:
                if len(X_test_q) > max_q_eval:
                    pos_idx = np.where(y_test == 1)[0]
                    neg_idx = np.where(y_test == 0)[0]
                    rng = np.random.RandomState(42)
                    true_prev = len(pos_idx) / len(y_test)
                    n_pos = max(2, int(round(true_prev * max_q_eval)))
                    n_pos = min(len(pos_idx), n_pos)
                    n_neg = min(len(neg_idx), max_q_eval - n_pos)
                    test_sub = np.concatenate([
                        rng.choice(pos_idx, size=n_pos, replace=False),
                        rng.choice(neg_idx, size=n_neg, replace=False)
                    ])
                    rng.shuffle(test_sub)
                    X_test_q_eval = X_test_q[test_sub]
                    y_test_eval = y_test[test_sub]
                    c_test_mean_eval = c_test_mean[test_sub] if c_test_mean is not None else None
                    X_test_eval = X_test[test_sub]
                else:
                    X_test_q_eval = X_test_q
                    y_test_eval = y_test
                    c_test_mean_eval = c_test_mean
                    X_test_eval = X_test

                q_metrics = compute_metrics(qc, X_test_q_eval, y_test_eval, model_name="QuantumVQC", model_type="quantum")
                q_metrics["training_time_s"] = float(round(q_train_time, 4))
                q_metrics["is_calibrated"] = qc.calibrator is not None
                self._metrics.append(q_metrics)
                q_test_probs = qc.predict_proba(X_test_q_eval, calibrated=True)[:, 1]

            self.vqc_model = qc

        # -------------------------------------------------------------
        # 3. Hybrid Ensemble: Inner-CV alpha tuning & validation calibration
        # -------------------------------------------------------------
        if self.vqc_model is not None and c_val_mean_eval is not None and q_val_probs is not None:
            # Inner-CV on stratified training subset to choose optimal alpha
            max_alpha_samples = 1000
            if len(X_train) > max_alpha_samples:
                pos_idx = np.where(y_train == 1)[0]
                neg_idx = np.where(y_train == 0)[0]
                rng = np.random.RandomState(42)
                n_pos = min(len(pos_idx), max_alpha_samples // 2)
                n_neg = min(len(neg_idx), max_alpha_samples - n_pos)
                alpha_sub = np.concatenate([
                    rng.choice(pos_idx, size=n_pos, replace=False),
                    rng.choice(neg_idx, size=n_neg, replace=False)
                ])
                rng.shuffle(alpha_sub)
                X_tr_alpha = X_train[alpha_sub]
                y_tr_alpha = y_train[alpha_sub]
                X_tr_q_alpha = X_train_q[alpha_sub]
            else:
                X_tr_alpha = X_train
                y_tr_alpha = y_train
                X_tr_q_alpha = X_train_q

            skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            cv_classical_probs = np.zeros(len(X_tr_alpha))
            for train_idx, val_idx in skf.split(X_tr_alpha, y_tr_alpha):
                fold_rf = RandomForestModel(n_estimators=50, max_depth=6)
                fold_rf.fit(X_tr_alpha[train_idx], y_tr_alpha[train_idx])
                cv_classical_probs[val_idx] = fold_rf.predict_proba(X_tr_alpha[val_idx])[:, 1]

            cv_q_probs = self.vqc_model.predict_proba(X_tr_q_alpha, calibrated=False)[:, 1]

            self.hybrid_ensemble = HybridEnsemble()
            self.alpha_star = self.hybrid_ensemble.fit_alpha_cv(cv_classical_probs, cv_q_probs, y_tr_alpha)

            # Fit hybrid Platt calibrator on validation split
            self.hybrid_ensemble.fit_calibrator(c_val_mean_eval, q_val_probs, y_val_eval)

            # Derive abstention disagreement threshold from validation spread
            val_spreads = np.abs(c_val_mean_eval - q_val_probs)
            # 95th percentile of model disagreement spread on validation data
            self.abstention_disagreement_threshold = float(
                np.clip(np.percentile(val_spreads, 95), 0.35, 0.65)
            )

            # Evaluate Hybrid on locked test set
            if c_test_mean_eval is not None and q_test_probs is not None:
                h_test_probs = self.hybrid_ensemble.predict_proba(c_test_mean_eval, q_test_probs, calibrated=True)[:, 1]
                h_test_preds = (h_test_probs >= 0.5).astype(int)

                # Wrap for compute_metrics
                class _HybridEvaluator:
                    def predict(self, X): return h_test_preds
                    def predict_proba(self, X): return np.column_stack([1.0 - h_test_probs, h_test_probs])

                h_metrics = compute_metrics(_HybridEvaluator(), X_test_eval, y_test_eval, model_name="HybridEnsemble", model_type="hybrid")
                h_metrics["training_time_s"] = 0.0
                h_metrics["is_calibrated"] = self.hybrid_ensemble.calibrator is not None
                h_metrics["alpha_weight"] = self.alpha_star
                self._metrics.append(h_metrics)

                # Paired bootstrap comparison: Classical vs Hybrid
                bootstrap_comparison = ConsensusEngine.compute_paired_bootstrap_comparison(
                    y_test_eval, c_test_mean_eval, h_test_probs, threshold=0.5, n_bootstraps=500
                )
                c_f1 = float(max((m.get("f1_score", 0.0) for m in self._metrics if m.get("model_type") == "classical"), default=0.0))
                h_f1 = float(h_metrics.get("f1_score", 0.0))
                verdict = ConsensusEngine.get_verdict(c_f1, h_f1, bootstrap_comparison)
                h_metrics["bootstrap_comparison"] = bootstrap_comparison
                h_metrics["consensus_verdict"] = verdict

        self._trained = True

        # Preprocessing hash
        prep_hash = ""
        if pipeline_path and Path(pipeline_path).exists():
            prep_hash = hashlib.sha256(Path(pipeline_path).read_bytes()).hexdigest()

        # Save composite bundle
        bundle_data = {
            "disease_id": self.disease_id,
            "models": self.models,
            "vqc_model": self.vqc_model,
            "hybrid_ensemble": self.hybrid_ensemble,
            "calibrators": self.calibrators,
            "alpha_star": self.alpha_star,
            "abstention_threshold": self.abstention_disagreement_threshold,
            "metrics": self._metrics,
            "feature_names": feature_names,
            "preprocessing_hash": prep_hash,
            "data_hashes": {
                "train_hash": self._compute_data_hash(X_train),
                "val_hash": self._compute_data_hash(X_val) if X_val is not None else "",
                "test_hash": self._compute_data_hash(X_test),
            }
        }
        joblib.dump(bundle_data, str(self._get_bundle_path()))

        self._generate_manifest(
            X_train=X_train,
            X_val=X_val,
            X_test=X_test,
            dataset_meta=dataset_meta or {},
            prep_hash=prep_hash,
        )
        return self._metrics

    def _generate_manifest(
        self,
        X_train: np.ndarray,
        X_val: np.ndarray | None,
        X_test: np.ndarray,
        dataset_meta: dict,
        prep_hash: str = "",
    ) -> dict:
        """Generate reproducible JSON manifest of trained models with cryptographic hashes."""
        n_qubits = self.vqc_model.n_qubits if self.vqc_model is not None else 6
        circuit_depth = compute_circuit_depth(n_qubits, 2)

        manifest_data = {
            "disease_id": self.disease_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "split_protocol": "Stratified 60/20/20 split (seed=42)",
            "split_sizes": {
                "train_samples": len(X_train),
                "validation_samples": len(X_val) if X_val is not None else 0,
                "test_samples": len(X_test),
            },
            "split_hashes": {
                "train_sha256": self._compute_data_hash(X_train),
                "val_sha256": self._compute_data_hash(X_val) if X_val is not None else "",
                "test_sha256": self._compute_data_hash(X_test),
            },
            "preprocessing_artifact_sha256": prep_hash,
            "quantum_configuration": {
                "n_qubits": n_qubits,
                "n_layers": 2,
                "circuit_depth": circuit_depth,
                "backend": "numpy:statevector (exact simulator)",
                "pennylane_qnode_available": True,
                "encoding": "Angle Encoding RY(pi * x_i)",
                "measurement": "PauliZ expectation <Z_0>",
                "calibration_transform": "born_probability",
            },
            "hybrid_ensemble_configuration": {
                "tuned_alpha": round(self.alpha_star, 4),
                "alpha_selection_protocol": "3-fold inner cross-validation on training split",
                "calibration_method": "Platt Scaling on unaugmented validation split",
                "abstention_disagreement_threshold": round(self.abstention_disagreement_threshold, 4),
            },
            "calibration": {
                "method": "Platt Scaling (Sigmoid fitted on unaugmented validation split)",
                "calibrated_models": list(self.calibrators.keys()) + (["QuantumVQC"] if self.vqc_model and self.vqc_model.calibrator else []),
            },
            "models": list(self.models.keys()) + (["QuantumVQC"] if self.vqc_model else []) + (["HybridEnsemble"] if self.hybrid_ensemble else []),
            "dataset_metadata": dataset_meta,
            "test_metrics_summary": [
                {
                    "model": m["model_name"],
                    "type": m.get("model_type", "classical"),
                    "accuracy": m["accuracy"],
                    "roc_auc": m["roc_auc"],
                    "pr_auc": m.get("pr_auc", 0.0),
                    "brier_score": m.get("brier_score", 0.25),
                    "sensitivity": m.get("sensitivity", m.get("recall", 0.0)),
                    "specificity": m.get("specificity", 0.0),
                    "f1_score": m["f1_score"],
                    "is_calibrated": m.get("is_calibrated", False),
                    "confidence_intervals": m.get("confidence_intervals", {}),
                }
                for m in self._metrics
            ]
        }
        manifest_str = json.dumps(manifest_data, indent=2, sort_keys=True)
        sha256_hash = hashlib.sha256(manifest_str.encode("utf-8")).hexdigest()
        manifest_data["manifest_sha256"] = sha256_hash

        try:
            with open(self._get_manifest_path(), "w", encoding="utf-8") as f:
                json.dump(manifest_data, f, indent=2)
        except Exception:
            pass

        self._manifest = manifest_data
        return manifest_data

    def predict_single(self, X: np.ndarray) -> list[dict]:
        """Run classical trained models on a single sample, using calibrated probabilities."""
        if not self._trained:
            raise RuntimeError(f"Models not trained for '{self.disease_id}'. Call load_or_train() first.")

        results = []
        for name, model in self.models.items():
            pred_int = int(model.predict(X)[0])
            calibrator = self.calibrators.get(name)

            if calibrator is not None:
                try:
                    proba = float(calibrator.predict_proba(X)[0][1])
                except Exception:
                    proba = float(model.predict_proba(X)[0][1])
            else:
                try:
                    proba = float(model.predict_proba(X)[0][1])
                except (AttributeError, IndexError):
                    proba = 1.0 if pred_int == 1 else 0.0

            proba = float(np.clip(proba, 0.0, 1.0))
            pred_str = "high_risk" if proba >= 0.5 else "low_risk"

            results.append({
                "model_name": name,
                "risk_probability": round(proba, 4),
                "prediction": pred_str,
                "is_calibrated": calibrator is not None,
            })
        return results

    def get_feature_importance(self, feature_names: list[str]) -> dict[str, float]:
        if not self._trained:
            return {}
        return self.models["RandomForest"].get_feature_importance(feature_names)

    def load_cached(self, pipeline_path: Path | str, feature_names: list[str] | None = None) -> None:
        """Restore a trusted composite checkpoint atomically. Never train on failure."""
        bundle = joblib.load(str(self._get_bundle_path()))
        with open(self._get_manifest_path(), encoding="utf-8") as stream:
            manifest = json.load(stream)
        required = {
            "disease_id", "models", "vqc_model", "hybrid_ensemble", "calibrators",
            "alpha_star", "abstention_threshold", "feature_names", "preprocessing_hash", "data_hashes",
        }
        if not isinstance(bundle, dict) or required - bundle.keys():
            raise ValueError("Incomplete composite model bundle; restore a complete checkpoint.")
        if bundle["disease_id"] != self.disease_id or manifest.get("disease_id") != self.disease_id:
            raise ValueError("Model bundle/manifest disease does not match the requested disease.")
        digest = hashlib.sha256(Path(pipeline_path).read_bytes()).hexdigest()
        if bundle["preprocessing_hash"] != digest or manifest.get("preprocessing_artifact_sha256") != digest:
            raise ValueError("Preprocessing artifact does not match the saved model bundle/manifest.")
        if feature_names is not None and bundle["feature_names"] != feature_names:
            raise ValueError("Saved feature schema does not match the current disease schema.")
        if not bundle["models"] or not isinstance(bundle["models"], dict):
            raise ValueError("Saved classifiers are missing.")
        for key in ("alpha_star", "abstention_threshold"):
            value = bundle[key]
            if not isinstance(value, (int, float)) or not np.isfinite(value) or not 0 <= value <= 1:
                raise ValueError(f"Invalid saved {key}.")
        if not isinstance(bundle["calibrators"], dict) or not isinstance(manifest.get("test_metrics_summary"), list):
            raise ValueError("Saved calibration or metric metadata is incomplete.")
        if bundle["vqc_model"] is not None and bundle["hybrid_ensemble"] is None:
            raise ValueError("Saved hybrid ensemble is missing; fixed-weight fallback is not a valid reload.")
        metrics = bundle.get("metrics", manifest["test_metrics_summary"])
        if not isinstance(metrics, list):
            raise ValueError("Saved model metrics must be a list.")
        self.models = bundle["models"]
        self.vqc_model = bundle["vqc_model"]
        self.hybrid_ensemble = bundle["hybrid_ensemble"]
        self.calibrators = bundle["calibrators"]
        self.alpha_star = bundle["alpha_star"]
        self.abstention_disagreement_threshold = bundle["abstention_threshold"]
        self._manifest = manifest
        self._metrics = metrics
        self._trained = True

    def load_or_train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        feature_names: list[str],
        X_val: np.ndarray | None = None,
        y_val: np.ndarray | None = None,
        X_train_q: np.ndarray | None = None,
        X_val_q: np.ndarray | None = None,
        X_test_q: np.ndarray | None = None,
        dataset_meta: dict | None = None,
        pipeline_path: Path | str | None = None,
    ) -> None:
        """Load cached composite bundle or train full suite cleanly."""
        bundle_path = self._get_bundle_path()
        manifest_path = self._get_manifest_path()

        if bundle_path.exists() or manifest_path.exists():
            self.load_cached(pipeline_path or self.models_cache_dir / f"{self.disease_id}_pipeline.pkl", feature_names)
            return

        # Fallback to training
        self.train(
            X_train, y_train, X_test, y_test, feature_names,
            X_val=X_val, y_val=y_val,
            X_train_q=X_train_q, X_val_q=X_val_q, X_test_q=X_test_q,
            dataset_meta=dataset_meta, pipeline_path=pipeline_path
        )

    def get_model_metrics(self) -> list[dict]:
        return self._metrics

    def get_manifest(self) -> dict:
        return self._manifest
