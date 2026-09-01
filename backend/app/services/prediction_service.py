"""
Prediction service — with persisted preprocessing, dual scaling, and honest metrics.

Integrates ClassicalMLTrainer, PreprocessingPipeline, and QuantumClassifier.
Loads trained models and persisted preprocessing pipelines.
"""
import time
import logging
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split

from app.core.config import settings
from app.datasets.loader import DatasetLoader
from app.classical_ml.trainer import ClassicalMLTrainer
from app.preprocessing.pipeline import PreprocessingPipeline
from app.quantum_ml.vqc import QuantumClassifier

logger = logging.getLogger("quantumhealth.services.prediction")


class ConsensusEngine:
    """Majority-vote consensus between classical and quantum models."""

    def build_consensus(
        self, classical_predictions, quantum_prediction,
        hybrid_probability, classical_probabilities, quantum_probability,
    ) -> dict:
        all_votes = list(classical_predictions.values()) + [quantum_prediction]
        high_count = sum(1 for v in all_votes if v == "high_risk")
        total = len(all_votes)

        if high_count == total or high_count == 0:
            agreement = "strong_agreement"
        elif abs(high_count - total / 2) <= 1:
            agreement = "moderate_agreement"
        else:
            agreement = "disagreement"

        final_vote = "high_risk" if hybrid_probability >= 0.5 else "low_risk"
        classical_majority = "high_risk" if high_count > total / 2 else "low_risk"
        disagreement_detected = classical_majority != quantum_prediction

        if final_vote == "high_risk":
            recommendation = "consult_physician"
        elif agreement == "disagreement":
            recommendation = "retest_recommended"
        else:
            recommendation = "routine_followup"

        return {
            "agreement": agreement,
            "recommendation": recommendation,
            "classical_votes": classical_predictions,
            "quantum_vote": quantum_prediction,
            "final_vote": final_vote,
            "disagreement_detected": disagreement_detected,
        }

    def get_verdict(self, best_classical_f1: float, hybrid_f1: float) -> dict:
        delta = hybrid_f1 - best_classical_f1
        if delta > 0.01:
            return {
                "winner": "Hybrid QML (VQC + Ensemble)",
                "verdict": "hybrid_better",
                "explanation": (
                    f"The hybrid model outperforms the best classical model "
                    f"by {delta:.4f} F1-score on the held-out test set."
                ),
            }
        elif delta < -0.01:
            return {
                "winner": "Classical Ensemble",
                "verdict": "classical_better",
                "explanation": (
                    f"The best classical model outperforms the hybrid model "
                    f"by {abs(delta):.4f} F1-score. The quantum component "
                    f"did not improve performance on this dataset."
                ),
            }
        else:
            return {
                "winner": "Tie",
                "verdict": "similar_performance",
                "explanation": (
                    f"Classical and hybrid models show similar performance "
                    f"(F1 delta = {delta:.4f}). Further research required."
                ),
            }


def risk_level_from_probability(p: float) -> str:
    if p < 0.25:
        return "low"
    elif p < 0.50:
        return "moderate"
    elif p < 0.75:
        return "high"
    return "very_high"


def get_feature_importance_report(
    model, X_norm, feature_names, feature_labels
) -> list[dict]:
    """Compute feature importance."""
    try:
        if hasattr(model, "feature_importances_"):
            raw = model.feature_importances_
        elif hasattr(model, "model") and hasattr(model.model, "feature_importances_"):
            raw = model.model.feature_importances_
        else:
            return []
        total = raw.sum() if raw.sum() > 0 else 1
        normed = raw / total
        items = []
        for i, name in enumerate(feature_names):
            items.append({
                "feature": name,
                "label": feature_labels.get(name, name),
                "importance": round(float(normed[i]), 4),
                "rank": 0,
            })
        items.sort(key=lambda x: x["importance"], reverse=True)
        for rank, item in enumerate(items, 1):
            item["rank"] = rank
        return items
    except Exception:
        return []


def build_processing_steps(_info: dict) -> list[dict]:
    return [
        {"step": 1, "name": "Data Cleaning", "status": "completed"},
        {"step": 2, "name": "Classical Feature Normalization (StandardScaler)", "status": "completed"},
        {"step": 3, "name": "Quantum Feature Normalization (MinMaxScaler [0,1])", "status": "completed"},
        {"step": 4, "name": "Quantum Feature Selection (SelectKBest)", "status": "completed"},
        {"step": 5, "name": "Classical Ensemble Inference", "status": "completed"},
        {"step": 6, "name": "VQC Quantum Simulation", "status": "completed"},
        {"step": 7, "name": "Hybrid Fusion Decision", "status": "completed"},
    ]


class PredictionService:
    """Service for making predictions using trained classical + quantum models and persisted preprocessing."""

    def __init__(self, dataset_loader: DatasetLoader, models_cache_dir: Path):
        self._trainers: dict[str, ClassicalMLTrainer] = {}
        self._pipelines: dict[str, PreprocessingPipeline] = {}
        self._consensus_engine = ConsensusEngine()
        self._dataset_loader = dataset_loader
        self._models_cache_dir = models_cache_dir

    async def get_or_train_models(
        self, disease_id: str, *, force_retrain: bool = False,
    ) -> None:
        """Load cached models and preprocessing pipeline or train fresh."""
        already_loaded = disease_id in self._trainers and disease_id in self._pipelines and not force_retrain
        if already_loaded:
            return

        pipeline_path = self._models_cache_dir / f"{disease_id}_pipeline.pkl"
        trainer = ClassicalMLTrainer(disease_id, self._models_cache_dir)
        pipeline = PreprocessingPipeline(n_quantum_features=settings.quantum_n_qubits)

        if pipeline_path.exists() and not force_retrain:
            try:
                pipeline.load(pipeline_path)
            except Exception:
                pipeline = None

        X, y, feature_names = self._dataset_loader.load(disease_id)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=settings.random_seed, stratify=y,
        )

        if pipeline is None or not pipeline._fitted:
            pipeline = PreprocessingPipeline(
                n_quantum_features=settings.quantum_n_qubits,
                model_version=f"{disease_id}_v1.0"
            )
            pipeline.fit(X_train, y_train, feature_names)
            pipeline.save(pipeline_path)

        X_train_classical, X_train_quantum = pipeline.transform(X_train)
        X_test_classical, X_test_quantum = pipeline.transform(X_test)

        if force_retrain:
            trainer.train(X_train_classical, y_train, X_test_classical, y_test, feature_names)
            pipeline.save(pipeline_path)
        else:
            trainer.load_or_train(X_train_classical, y_train, X_test_classical, y_test, feature_names)

        self._trainers[disease_id] = trainer
        self._pipelines[disease_id] = pipeline

    async def get_or_train_models_with_uploads(
        self, disease_id: str, db, *, force_retrain: bool = False,
    ) -> dict:
        """Train models using base + uploaded data."""
        trainer = ClassicalMLTrainer(disease_id, self._models_cache_dir)
        pipeline = PreprocessingPipeline(
            n_quantum_features=settings.quantum_n_qubits,
            model_version=f"{disease_id}_v1.0"
        )
        pipeline_path = self._models_cache_dir / f"{disease_id}_pipeline.pkl"

        X, y, feature_names, data_info = await self._dataset_loader.load_with_uploads(
            disease_id, db
        )

        if len(X) < 10:
            raise ValueError(f"Insufficient data: {len(X)} samples (minimum 10).")
        if len(np.unique(y)) < 2:
            raise ValueError(
                f"Only one class present (label={int(np.unique(y)[0])}). "
                "Need both 0 and 1 labels for training."
            )

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=settings.random_seed, stratify=y,
        )

        pipeline.fit(X_train, y_train, feature_names)
        pipeline.save(pipeline_path)

        X_train_classical, X_train_quantum = pipeline.transform(X_train)
        X_test_classical, X_test_quantum = pipeline.transform(X_test)

        if force_retrain:
            trainer.train(X_train_classical, y_train, X_test_classical, y_test, feature_names)
        else:
            trainer.load_or_train(X_train_classical, y_train, X_test_classical, y_test, feature_names)

        self._trainers[disease_id] = trainer
        self._pipelines[disease_id] = pipeline
        return data_info

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------
    async def predict(self, disease_id: str, features_dict: dict, mode: str = "hybrid") -> dict:
        await self.get_or_train_models(disease_id)

        pipeline = self._pipelines[disease_id]
        trainer = self._trainers[disease_id]

        disease_info = self._dataset_loader.get_disease_info(disease_id)
        feature_names = [f["name"] for f in disease_info["features"]]
        feature_labels = {f["name"]: f.get("label", f["name"]) for f in disease_info["features"]}

        # 1. Preprocessing: StandardScaler for Classical, MinMaxScaler [0, 1] for Quantum
        X_classical, X_quantum = pipeline.transform_single(features_dict, feature_names)
        classical_results = trainer.predict_single(X_classical)

        # 2. Quantum VQC Inference
        q_start = time.time()
        simulation_mode = True
        vqc_path = self._models_cache_dir / f"{disease_id}_vqc.pkl"
        if not vqc_path.exists():
            raise RuntimeError(
                f"No trained quantum model is available for '{disease_id}'. "
                "Train the model first using POST /api/v1/models/train."
            )

        try:
            qc = QuantumClassifier(
                n_qubits=settings.quantum_n_qubits,
                n_layers=settings.quantum_n_layers,
                n_epochs=settings.quantum_vqc_epochs,
                max_training_samples=settings.quantum_max_train_samples,
            )
            if vqc_path.exists():
                qc.load(vqc_path)
            q_prob = float(qc.predict_proba_single(X_quantum.flatten()[:settings.quantum_n_qubits]))
        except Exception as exc:
            raise RuntimeError(
                f"The trained quantum model for '{disease_id}' could not be loaded or evaluated. "
                "Retrain it using POST /api/v1/models/train."
            ) from exc

        q_pred_str = "high_risk" if q_prob >= 0.5 else "low_risk"
        q_time = (time.time() - q_start) * 1000

        quantum_result = {
            "backend": settings.quantum_backend,
            "qubits_used": settings.quantum_n_qubits,
            "circuit_depth": settings.quantum_n_layers * 2 + 1,
            "encoding": "Angle Encoding",
            "risk_probability": round(q_prob, 4),
            "prediction": q_pred_str,
            "simulation_mode": True,
            "execution_time_ms": round(q_time, 2),
        }

        # 3. Hybrid Fusion Decision Layer
        c_probs = [r["risk_probability"] for r in classical_results]
        c_mean = sum(c_probs) / max(len(c_probs), 1)

        if mode == "quantum":
            hybrid_prob = q_prob
        elif mode == "classical":
            hybrid_prob = c_mean
        else:
            hybrid_prob = float(min(1.0, max(0.0, c_mean * 0.60 + q_prob * 0.40)))

        hybrid_pred_str = "high_risk" if hybrid_prob >= 0.5 else "low_risk"
        hybrid_confidence = abs(hybrid_prob - 0.5) * 2

        hybrid_result = {
            "risk_probability": round(hybrid_prob, 4),
            "risk_percentage": round(hybrid_prob * 100, 1),
            "prediction": hybrid_pred_str,
            "confidence": round(hybrid_confidence, 4),
            "risk_level": risk_level_from_probability(hybrid_prob),
        }

        classical_votes = {r["model_name"]: r["prediction"] for r in classical_results}
        consensus = self._consensus_engine.build_consensus(
            classical_predictions=classical_votes,
            quantum_prediction=q_pred_str,
            hybrid_probability=hybrid_prob,
            classical_probabilities={r["model_name"]: r["risk_probability"] for r in classical_results},
            quantum_probability=q_prob,
        )

        fi_report = get_feature_importance_report(
            trainer.models["RandomForest"], X_classical, feature_names, feature_labels,
        )

        prep_info = pipeline.get_preprocessing_info()

        quantum_readiness = {
            "original_features": len(feature_names),
            "selected_features": settings.quantum_n_qubits,
            "qubits_required": settings.quantum_n_qubits,
            "dimensionality_reduction_ratio": round(settings.quantum_n_qubits / max(len(feature_names), 1), 2),
            "encoding_method": "Angle Encoding (RY)",
            "circuit_depth": settings.quantum_n_layers * 2 + 1,
            "layers": settings.quantum_n_layers,
            "backend": settings.quantum_backend,
            "simulation_status": "Simulated" if simulation_mode else "Hardware Ready",
            "feature_to_qubit_map": {
                name: i
                for i, name in enumerate(
                    prep_info.get("selected_features", feature_names[: settings.quantum_n_qubits])
                )
            },
        }

        return {
            "disease": disease_id,
            "classical_results": classical_results,
            "quantum_result": quantum_result,
            "hybrid_result": hybrid_result,
            "consensus": consensus,
            "feature_importance": fi_report,
            "quantum_readiness": quantum_readiness,
            "processing_steps": build_processing_steps({}),
            "disclaimer": (
                "This platform is an experimental AI-assisted decision-support prototype "
                "operating in Quantum Simulation Mode. Not for direct clinical diagnosis."
            ),
        }

    # ------------------------------------------------------------------
    # Model comparison — real metrics only
    # ------------------------------------------------------------------
    async def get_model_comparison(self, disease_id: str) -> dict:
        """Return real evaluated metrics for all models without artificial boosts."""
        await self.get_or_train_models(disease_id)
        metrics = self._trainers[disease_id].get_model_metrics()
        best_classical = max(metrics, key=lambda x: x["accuracy"])

        pipeline = self._pipelines[disease_id]
        X, y, feature_names = self._dataset_loader.load(disease_id)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=settings.random_seed, stratify=y,
        )
        X_train_classical, X_train_quantum = pipeline.transform(X_train)
        X_test_classical, X_test_quantum = pipeline.transform(X_test)

        try:
            qc = QuantumClassifier(
                n_qubits=settings.quantum_n_qubits,
                n_layers=settings.quantum_n_layers,
                n_epochs=settings.quantum_vqc_epochs,
                max_training_samples=settings.quantum_max_train_samples,
            )

            vqc_path = self._models_cache_dir / f"{disease_id}_vqc.pkl"
            if vqc_path.exists():
                qc.load(vqc_path)
            else:
                qc.fit(X_train_quantum, y_train)
                qc.save(vqc_path)

            q_start = time.time()
            q_proba = qc.predict_proba(X_test_quantum)
            q_time = (time.time() - q_start) * 1000
            q_pred = qc.predict(X_test_quantum)

            from app.classical_ml.evaluator import compute_metrics as compute_m

            # Quantum-only metrics
            quantum_metrics_dict = compute_m(qc, X_test_quantum, y_test, model_name="VQC", model_type="quantum")
            quantum_metrics_dict["training_time_s"] = 0.0
            quantum_metrics_dict["inference_time_ms"] = round(q_time, 3)

            # Hybrid: 60% classical ensemble mean + 40% quantum
            c_proba_list = []
            for name, model in self._trainers[disease_id].models.items():
                try:
                    p = model.predict_proba(X_test_classical)[:, 1]
                except Exception:
                    p = model.predict(X_test_classical).astype(float)
                c_proba_list.append(p)

            c_mean_proba = np.mean(c_proba_list, axis=0)
            hybrid_proba = 0.6 * c_mean_proba + 0.4 * q_proba[:, 1]
            hybrid_pred = (hybrid_proba >= 0.5).astype(int)

            from sklearn.metrics import (
                accuracy_score, precision_score, recall_score,
                f1_score, roc_auc_score, confusion_matrix,
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
                "model_name": "Hybrid QML (VQC + Ensemble)",
                "model_type": "hybrid",
                "accuracy": round(hybrid_acc, 4),
                "precision": round(hybrid_prec, 4),
                "recall": round(hybrid_rec, 4),
                "f1_score": round(hybrid_f1, 4),
                "roc_auc": round(hybrid_auc, 4),
                "training_time_s": 0.0,
                "inference_time_ms": round(q_time, 2),
                "confusion_matrix": hybrid_cm,
            }

        except (ImportError, Exception) as e:
            logger.warning(f"Quantum evaluation failed: {e}. Skipping hybrid metrics.")
            hybrid_metrics = None
            hybrid_f1 = 0.0

        all_metrics = list(metrics)
        if hybrid_metrics:
            all_metrics.append(hybrid_metrics)

        best_f1 = best_classical.get("f1_score", 0)
        verdict_data = self._consensus_engine.get_verdict(best_f1, hybrid_f1)

        return {
            "disease": disease_id,
            "models": all_metrics,
            "winner": verdict_data["winner"],
            "verdict": verdict_data["verdict"],
            "verdict_explanation": verdict_data["explanation"],
        }
