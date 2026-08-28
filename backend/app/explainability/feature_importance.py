"""
Feature importance and explainability module (Team Member 2 / Team Member 3).

Computes transparent feature attributions using ensemble importances,
linear coefficients, and permutation feature importance across normalized clinical parameters.
"""
import numpy as np
from typing import Any, List, Dict


def get_feature_importance_report(
    model: Any,
    X_sample: np.ndarray,
    feature_names: list,
    feature_labels: dict,
    top_n: int = 6,
) -> List[Dict[str, Any]]:
    """
    Return ranked feature importances matching the FeatureImportance schema.

    Args:
        model: A trained sklearn estimator (e.g. RandomForest or LogisticRegression).
        X_sample: Feature array (1 or more samples), shape (n_samples, n_features).
        feature_names: List of feature name strings.
        feature_labels: Dict mapping feature_name -> human-readable label.
        top_n: Number of top features to return.

    Returns:
        List of dicts with keys: feature, label, importance, rank.
    """
    importances: Dict[str, float] = {}

    # Strategy 1: tree-based feature_importances_ (RandomForest)
    if hasattr(model, "feature_importances_"):
        raw = model.feature_importances_
        for name, imp in zip(feature_names, raw):
            importances[name] = float(imp)

    # Strategy 2: linear model coefficients (LogisticRegression, LinearSVC)
    elif hasattr(model, "coef_"):
        coef = np.abs(model.coef_).flatten()
        if len(coef) == len(feature_names):
            for name, imp in zip(feature_names, coef):
                importances[name] = float(imp)

    # Strategy 3: uniform fallback
    if not importances:
        n = len(feature_names)
        for name in feature_names:
            importances[name] = 1.0 / n

    # Normalize to [0, 1]
    total = sum(importances.values())
    if total > 1e-10:
        importances = {k: v / total for k, v in importances.items()}

    # Sort by importance descending
    sorted_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    top_features = sorted_features[:top_n]

    result = []
    for rank, (feature, importance) in enumerate(top_features, start=1):
        result.append({
            "feature": feature,
            "label": feature_labels.get(feature, feature.replace("_", " ").title()),
            "importance": round(float(importance), 4),
            "rank": rank,
        })

    return result


def compute_permutation_importance(
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: list,
    n_repeats: int = 5,
    random_state: int = 42,
) -> Dict[str, float]:
    """
    Compute permutation feature importance using scikit-learn.
    Returns {feature_name: mean_importance}.
    """
    try:
        from sklearn.inspection import permutation_importance
        result = permutation_importance(
            model, X_test, y_test,
            n_repeats=n_repeats,
            random_state=random_state,
            scoring="roc_auc",
        )
        total = sum(abs(imp) for imp in result.importances_mean) or 1.0
        return {
            name: round(float(abs(imp) / total), 4)
            for name, imp in zip(feature_names, result.importances_mean)
        }
    except Exception:
        return {}
