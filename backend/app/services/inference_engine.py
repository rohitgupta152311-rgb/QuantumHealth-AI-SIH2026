import time
import numpy as np

def risk_level_from_probability(p: float) -> str:
    if p < 0.25:
        return "low"
    elif p < 0.50:
        return "moderate"
    elif p < 0.75:
        return "high"
    return "very_high"

class InferenceEngine:
    def __init__(self, consensus_engine, settings, models_cache_dir):
        self._consensus_engine = consensus_engine
        self.settings = settings
        self._models_cache_dir = models_cache_dir

    def predict_single(self, disease_id, features_dict, disease_info, trainer, pipeline, qc, mode="hybrid") -> dict:
        manifest = trainer.get_manifest() or {}

        # Validation
        for f in disease_info.get("features", []):
            name = f["name"]
            if name in features_dict:
                val = float(features_dict[name])
                sentinels = f.get("missing_sentinels", [])
                if sentinels and any(np.isclose(val, s, atol=1e-4) for s in sentinels):
                    if f.get("required", True):
                        return {
                            "status": "abstained",
                            "abstention_reason": f"Required biomarker '{f.get('label', name)}' was entered as a missing sentinel value ({val}). The model abstains from computing an unreliable risk score.",
                            "model_manifest_hash": manifest.get("manifest_sha256"),
                            "disclaimer": "Model abstained to prevent deceptive prediction on missing required clinical data."
                        }

                if "model_input_range" in f:
                    rmin, rmax = f["model_input_range"]
                elif "min_val" in f and "max_val" in f:
                    rmin, rmax = f["min_val"], f["max_val"]
                else:
                    rmin, rmax = -1e9, 1e9

                if val < (rmin - 1e-3) or val > (rmax + 1e-3):
                    return {
                        "status": "abstained",
                        "abstention_reason": f"Biomarker '{f.get('label', name)}' value ({val} {f.get('unit') or ''}) is outside the model-supported training range [{rmin}, {rmax}].",
                        "model_manifest_hash": manifest.get("manifest_sha256"),
                        "disclaimer": "Model abstained to prevent extrapolation outside the empirical training distribution."
                    }

        feature_names = [f["name"] for f in disease_info["features"]]
        X_classical, X_quantum = pipeline.transform_single(features_dict, feature_names)
        classical_results = trainer.predict_single(X_classical)

        # Quantum VQC Inference
        q_start = time.time()
        try:
            if qc is None:
                raise RuntimeError(f"Quantum VQC model has not been trained for '{disease_id}'.")
            q_prob = float(qc.predict_proba_single(X_quantum.flatten()[:self.settings.quantum_n_qubits], calibrated=True))
        except Exception as exc:
            raise RuntimeError(f"Quantum model evaluation failed for '{disease_id}': {exc}") from exc

        q_pred_str = "high_risk" if q_prob >= 0.5 else "low_risk"
        q_time = (time.time() - q_start) * 1000

        c_probs = [r["risk_probability"] for r in classical_results]
        c_mean = sum(c_probs) / max(len(c_probs), 1)
        all_probs = c_probs + [q_prob]
        disagreement_range = self._consensus_engine.compute_disagreement_range(all_probs)
        prob_spread = disagreement_range["spread"]
        
        # Abstention threshold is derived strictly from validation |c_mean - q_prob|
        cq_diff = abs(c_mean - q_prob)
        abstention_threshold = getattr(trainer, "abstention_disagreement_threshold", 0.45)

        if cq_diff > abstention_threshold:
            return {
                "status": "abstained",
                "abstention_reason": f"High classical-quantum model disagreement (divergence = {cq_diff:.2f} > validated safe threshold {abstention_threshold:.2f}). Candidate models diverge significantly on this profile, precluding a reliable diagnostic risk assessment.",
                "disagreement_range": disagreement_range,
                "model_manifest_hash": manifest.get("manifest_sha256"),
                "disclaimer": "Model abstained to prevent delivering a false sense of certainty."
            }
        if mode == "quantum":
            hybrid_prob = q_prob
        elif mode == "classical":
            hybrid_prob = c_mean
        else:
            if getattr(trainer, "hybrid_ensemble", None) is not None:
                hybrid_prob = float(trainer.hybrid_ensemble.predict_proba_single(c_mean, q_prob, calibrated=True))
            else:
                hybrid_prob = float(min(1.0, max(0.0, c_mean * 0.60 + q_prob * 0.40)))

        hybrid_pred_str = "high_risk" if hybrid_prob >= 0.5 else "low_risk"

        return {
            "status": "completed",
            "classical_results": classical_results,
            "q_prob": q_prob,
            "q_pred_str": q_pred_str,
            "q_time": q_time,
            "hybrid_prob": hybrid_prob,
            "hybrid_pred_str": hybrid_pred_str,
            "disagreement_range": disagreement_range,
            "X_classical": X_classical,
            "X_quantum": X_quantum
        }
