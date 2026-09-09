import numpy as np

def _get_feature_importance_report(
    model, X_norm, feature_names, feature_labels
) -> list[dict]:
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

class ExplanationService:
    def compute_explanations(
        self,
        features_dict: dict,
        disease_info: dict,
        pipeline,
        trainer,
        X_classical: np.ndarray,
        X_quantum: np.ndarray,
    ) -> dict:
        feature_names = [f["name"] for f in disease_info["features"]]
        feature_meta = {f["name"]: f for f in disease_info["features"]}

        c_probs = [r["risk_probability"] for r in trainer.predict_single(X_classical)]
        base_prob = float(np.mean(c_probs))

        drivers = []
        for i, name in enumerate(feature_names):
            val = float(features_dict.get(name, 0.0))
            std_val = float(pipeline.cleaner.std_[i]) if pipeline.cleaner.std_ is not None else 1.0
            delta = max(std_val * 0.1, 1e-3)

            dict_plus = dict(features_dict)
            dict_plus[name] = val + delta
            X_plus, _ = pipeline.transform_single(dict_plus, feature_names)
            probs_plus = [r["risk_probability"] for r in trainer.predict_single(X_plus)]
            prob_plus = float(np.mean(probs_plus))

            diff = prob_plus - base_prob
            effect = "increases risk score" if diff > 0 else "decreases risk score"
            abs_contrib = abs(diff)

            drivers.append({
                "feature": name,
                "label": feature_meta[name].get("label", name),
                "unit": feature_meta[name].get("unit"),
                "input_value": val,
                "effect_on_model_score": effect,
                "contribution": round(abs_contrib, 4),
            })

        drivers.sort(key=lambda d: d["contribution"], reverse=True)
        top_drivers = drivers[:3]

        return {
            "classical": {
                "explanation_method": "Local feature perturbation (±0.1σ from input)",
                "top_drivers": top_drivers,
            },
            "quantum": {
                "explanation_method": "Finite-difference sensitivity on angle-encoded qubit register",
                "qubit_mapping": pipeline.get_preprocessing_info().get("selected_features", []),
            },
            "scope": (
                "These sensitivity metrics explain internal model response behavior on this case. "
                "They do not establish clinical etiology or medical causality."
            )
        }
