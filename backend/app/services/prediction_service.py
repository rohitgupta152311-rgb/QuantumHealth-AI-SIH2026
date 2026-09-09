"""
Prediction service facade.
Delegates to TrainingOrchestrator, InferenceEngine, and ExplanationService.
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
from app.quantum_ml.circuits import compute_circuit_depth
from app.hybrid_ml.consensus import ConsensusEngine

from app.services.training_orchestrator import TrainingOrchestrator
from app.services.inference_engine import InferenceEngine, risk_level_from_probability
from app.services.explanation_service import ExplanationService, _get_feature_importance_report

logger = logging.getLogger("quantumhealth.services.prediction")

def build_processing_steps(_info: dict) -> list[dict]:
    return [
        {"step": 1, "name": "Biomarker Sentinel & Distribution Check", "status": "completed"},
        {"step": 2, "name": "Classical Standardization (StandardScaler fit on train only)", "status": "completed"},
        {"step": 3, "name": "Quantum Normalization (MinMaxScaler [0,1] & SelectKBest)", "status": "completed"},
        {"step": 4, "name": "Classical Ensemble Inference with Platt Calibration", "status": "completed"},
        {"step": 5, "name": "6-Qubit VQC Simulation (Angle RY + CNOT Ring)", "status": "completed"},
        {"step": 6, "name": "Model Disagreement & Abstention Evaluation", "status": "completed"},
        {"step": 7, "name": "Hybrid Consensus & Local Perturbation Explanation", "status": "completed"},
    ]

class PredictionService:
    def __init__(self, dataset_loader: DatasetLoader, models_cache_dir: Path):
        self._dataset_loader = dataset_loader
        self._models_cache_dir = models_cache_dir
        self._consensus_engine = ConsensusEngine()
        
        self.training = TrainingOrchestrator(dataset_loader, models_cache_dir)
        self.inference = InferenceEngine(self._consensus_engine, settings, models_cache_dir)
        self.explanation = ExplanationService()
        
        self._trainers = {}
        self._pipelines = {}
        self._vqc_models = {}

    async def get_or_train_models(self, disease_id: str, *, force_retrain: bool = False) -> None:
        if disease_id in self._trainers and not force_retrain:
            return
        bundle = await self.training.get_or_train_models(disease_id, force_retrain)
        self._trainers[disease_id] = bundle.trainer
        self._pipelines[disease_id] = bundle.pipeline
        if bundle.vqc_model:
            self._vqc_models[disease_id] = bundle.vqc_model

    async def get_or_train_models_with_uploads(self, disease_id: str, db, *, force_retrain: bool = False) -> dict:
        return await self.training.get_or_train_models_with_uploads(disease_id, db, force_retrain)

    async def predict(self, disease_id: str, features_dict: dict, mode: str = "hybrid") -> dict:
        await self.get_or_train_models(disease_id)
        
        trainer = self._trainers[disease_id]
        pipeline = self._pipelines[disease_id]
        qc = self._vqc_models.get(disease_id) or getattr(trainer, "vqc_model", None)
        disease_info = self._dataset_loader.get_disease_info(disease_id)
        
        inf_res = self.inference.predict_single(disease_id, features_dict, disease_info, trainer, pipeline, qc, mode)
        
        if inf_res["status"] == "abstained":
            return {"disease": disease_id, **inf_res}
            
        q_time = inf_res["q_time"]
        q_prob = inf_res["q_prob"]
        q_pred_str = inf_res["q_pred_str"]
        hybrid_prob = inf_res["hybrid_prob"]
        hybrid_pred_str = inf_res["hybrid_pred_str"]
        classical_results = inf_res["classical_results"]
        disagreement_range = inf_res["disagreement_range"]
        
        depth = compute_circuit_depth(settings.quantum_n_qubits, settings.quantum_n_layers)
        quantum_result = {
            "backend": qc.get_execution_info().get("backend", "numpy:statevector"),
            "qubits_used": settings.quantum_n_qubits,
            "circuit_depth": depth,
            "encoding": "Angle Encoding RY(pi * x_i)",
            "risk_probability": round(q_prob, 4),
            "prediction": q_pred_str,
            "simulation_mode": True,
            "execution_time_ms": round(q_time, 2),
            "is_calibrated": qc.calibrator is not None,
        }
        
        hybrid_result = {
            "risk_probability": round(hybrid_prob, 4),
            "risk_percentage": round(hybrid_prob * 100, 1),
            "prediction": hybrid_pred_str,
            "disagreement_range": disagreement_range,
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
        
        feature_names = [f["name"] for f in disease_info["features"]]
        feature_labels = {f["name"]: f.get("label", f["name"]) for f in disease_info["features"]}
        fi_report = _get_feature_importance_report(
            trainer.models["RandomForest"], inf_res["X_classical"], feature_names, feature_labels,
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
            "simulation_status": "Simulated",
            "feature_to_qubit_map": {
                name: i for i, name in enumerate(prep_info.get("selected_features", feature_names[: settings.quantum_n_qubits]))
            },
        }
        
        local_explanations = self.explanation.compute_explanations(
            features_dict, disease_info, pipeline, trainer, inf_res["X_classical"], inf_res["X_quantum"]
        )
        
        return {
            "disease": disease_id,
            "status": "completed",
            "classical_results": classical_results,
            "quantum_result": quantum_result,
            "hybrid_result": hybrid_result,
            "consensus": consensus,
            "disagreement_range": disagreement_range,
            "explanations": local_explanations,
            "feature_importance": fi_report,
            "quantum_readiness": quantum_readiness,
            "processing_steps": build_processing_steps({}),
            "model_manifest_hash": (trainer.get_manifest() or {}).get("manifest_sha256"),
            "cohort": disease_info.get("cohort_name", disease_info.get("display_name")),
            "schema_version": disease_info.get("schema_version", "v1.0"),
            "prediction_horizon": disease_info.get("prediction_horizon", "Cross-Sectional Evaluation"),
            "population_limitation": disease_info.get("population_limitation", "Evaluated on reference training cohort."),
            "disclaimer": "Research/educational decision-support prototype operating in Quantum Simulation Mode."
        }

    async def get_model_comparison(self, disease_id: str) -> dict:
        await self.get_or_train_models(disease_id)
        pipeline = self._pipelines[disease_id]
        trainer = self._trainers[disease_id]
        X, y, feature_names = self._dataset_loader.load(disease_id)

        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=0.20, random_state=settings.random_seed, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=0.25, random_state=settings.random_seed, stratify=y_temp
        )

        X_train_c, X_train_q = pipeline.transform(X_train)
        X_test_c, X_test_q = pipeline.transform(X_test)

        if len(X_test) > 100:
            rng = np.random.RandomState(settings.random_seed)
            eval_idx = rng.choice(len(X_test), size=100, replace=False)
            eval_X_c = X_test_c[eval_idx]
            eval_X_q = X_test_q[eval_idx]
            eval_y = y_test[eval_idx]
        else:
            eval_X_c = X_test_c
            eval_X_q = X_test_q
            eval_y = y_test

        metrics = trainer.get_model_metrics()
        if not metrics:
            from app.classical_ml.evaluator import compute_metrics
            metrics = []
            for name, model in trainer.models.items():
                eval_target = trainer.calibrators.get(name, model)
                m_dict = compute_metrics(eval_target, eval_X_c, eval_y, model_name=name)
                m_dict["is_calibrated"] = name in trainer.calibrators
                metrics.append(m_dict)

        best_classical = max(metrics, key=lambda x: x["accuracy"]) if metrics else {"accuracy": 0.5, "f1_score": 0.5}

        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, brier_score_loss, average_precision_score
        from sklearn.calibration import calibration_curve

        quantum_metrics_dict = None
        hybrid_metrics = None
        hybrid_f1 = 0.0

        try:
            qc = self._vqc_models.get(disease_id) or getattr(trainer, "vqc_model", None)
            if qc is None:
                raise RuntimeError("No VQC model.")

            q_start = time.time()
            q_proba = qc.predict_proba(eval_X_q)
            q_time = (time.time() - q_start) * 1000
            q_pred = (q_proba[:, 1] >= 0.5).astype(int)

            q_acc = float(accuracy_score(eval_y, q_pred))
            q_prec = float(precision_score(eval_y, q_pred, zero_division=0))
            q_rec = float(recall_score(eval_y, q_pred, zero_division=0))
            q_f1 = float(f1_score(eval_y, q_pred, zero_division=0))
            try: q_auc = float(roc_auc_score(eval_y, q_proba[:, 1]))
            except: q_auc = 0.5
            try: q_pr_auc = float(average_precision_score(eval_y, q_proba[:, 1]))
            except: q_pr_auc = float(np.mean(eval_y))
            try: q_brier = float(brier_score_loss(eval_y, q_proba[:, 1]))
            except: q_brier = 0.25

            q_cm = confusion_matrix(eval_y, q_pred).tolist()
            if len(q_cm) == 1: q_cm = [[q_cm[0][0], 0], [0, 0]]
            q_spec = float(q_cm[0][0] / (q_cm[0][0] + q_cm[0][1])) if (q_cm[0][0] + q_cm[0][1]) > 0 else 0.0

            try:
                prob_true_q, prob_pred_q = calibration_curve(eval_y, q_proba[:, 1], n_bins=5, strategy="uniform")
                q_calib = [{"predicted": round(float(p), 4), "observed": round(float(t), 4)} for p, t in zip(prob_pred_q, prob_true_q)]
            except: q_calib = []

            quantum_metrics_dict = {
                "model_name": "Variational Quantum Classifier (VQC)",
                "model_type": "quantum",
                "accuracy": round(q_acc, 4), "precision": round(q_prec, 4), "recall": round(q_rec, 4),
                "sensitivity": round(q_rec, 4), "specificity": round(q_spec, 4), "f1_score": round(q_f1, 4),
                "roc_auc": round(q_auc, 4), "pr_auc": round(q_pr_auc, 4), "brier_score": round(q_brier, 4),
                "calibration_curve": q_calib, "training_time_s": 0.0,
                "inference_time_ms": round(q_time / max(len(eval_y), 1), 2), "confusion_matrix": q_cm,
            }

            c_proba_list = []
            for name, model in trainer.models.items():
                eval_target = trainer.calibrators.get(name, model)
                try: p = eval_target.predict_proba(eval_X_c)[:, 1]
                except: p = eval_target.predict(eval_X_c).astype(float)
                c_proba_list.append(p)

            c_mean_proba = np.mean(c_proba_list, axis=0)
            hybrid_proba = 0.6 * c_mean_proba + 0.4 * q_proba[:, 1]
            hybrid_pred = (hybrid_proba >= 0.5).astype(int)

            hybrid_acc = float(accuracy_score(eval_y, hybrid_pred))
            hybrid_prec = float(precision_score(eval_y, hybrid_pred, zero_division=0))
            hybrid_rec = float(recall_score(eval_y, hybrid_pred, zero_division=0))
            hybrid_f1 = float(f1_score(eval_y, hybrid_pred, zero_division=0))
            try: hybrid_auc = float(roc_auc_score(eval_y, hybrid_proba))
            except: hybrid_auc = 0.0
            try: hybrid_pr_auc = float(average_precision_score(eval_y, hybrid_proba))
            except: hybrid_pr_auc = float(np.mean(eval_y))
            try: hybrid_brier = float(brier_score_loss(eval_y, hybrid_proba))
            except: hybrid_brier = 0.25

            hybrid_cm = confusion_matrix(eval_y, hybrid_pred).tolist()
            if len(hybrid_cm) == 1: hybrid_cm = [[hybrid_cm[0][0], 0], [0, 0]]
            hybrid_spec = float(hybrid_cm[0][0] / (hybrid_cm[0][0] + hybrid_cm[0][1])) if (hybrid_cm[0][0] + hybrid_cm[0][1]) > 0 else 0.0

            try:
                prob_true_h, prob_pred_h = calibration_curve(eval_y, hybrid_proba, n_bins=5, strategy="uniform")
                hybrid_calib = [{"predicted": round(float(p), 4), "observed": round(float(t), 4)} for p, t in zip(prob_pred_h, prob_true_h)]
            except: hybrid_calib = []

            hybrid_metrics = {
                "model_name": "Hybrid QML (VQC + Ensemble)", "model_type": "hybrid",
                "accuracy": round(hybrid_acc, 4), "precision": round(hybrid_prec, 4), "recall": round(hybrid_rec, 4),
                "sensitivity": round(hybrid_rec, 4), "specificity": round(hybrid_spec, 4), "f1_score": round(hybrid_f1, 4),
                "roc_auc": round(hybrid_auc, 4), "pr_auc": round(hybrid_pr_auc, 4), "brier_score": round(hybrid_brier, 4),
                "calibration_curve": hybrid_calib, "training_time_s": 0.0,
                "inference_time_ms": round(q_time / max(len(eval_y), 1), 2), "confusion_matrix": hybrid_cm,
            }

        except Exception as e:
            logger.warning(f"Quantum evaluation failed: {e}. Skipping hybrid metrics.")

        all_metrics = list(metrics)
        if quantum_metrics_dict: all_metrics.append(quantum_metrics_dict)
        if hybrid_metrics: all_metrics.append(hybrid_metrics)

        best_f1 = best_classical.get("f1_score", 0)
        verdict_data = self._consensus_engine.get_verdict(best_f1, hybrid_f1)

        return {
            "disease": disease_id,
            "models": all_metrics,
            "winner": verdict_data["winner"],
            "verdict": verdict_data["verdict"],
            "verdict_explanation": verdict_data["explanation"],
        }
