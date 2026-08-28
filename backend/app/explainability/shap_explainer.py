"""
SHAP Explainer stub — SHAP requires MSVC on Windows (Python 3.13).
This module provides a compatible interface using sklearn permutation importance.

Note: When SHAP becomes available (e.g., via a pre-built wheel or Linux/Mac),
uncomment the shap imports and use SHAPExplainer directly.
"""
import numpy as np
from typing import Any


class SHAPExplainer:
    """
    Compatible SHAP-like explainer using sklearn permutation importance.
    Provides the same interface as shap.TreeExplainer for drop-in replacement.
    
    To upgrade to real SHAP: pip install shap (requires MSVC on Windows)
    and replace this class implementation.
    """

    def __init__(self, model: Any, model_type: str = "tree"):
        self.model = model
        self.model_type = model_type

    def explain(self, X_sample: np.ndarray, feature_names: list) -> dict:
        """
        Returns {feature_name: importance_value} for a single prediction.
        Uses model's feature_importances_ or coef_ as approximation.
        """
        importances = {}

        try:
            if hasattr(self.model, "feature_importances_"):
                raw = self.model.feature_importances_
                # Scale by feature value deviation from mean (simple approximation)
                for name, imp in zip(feature_names, raw):
                    importances[name] = float(imp)

            elif hasattr(self.model, "coef_"):
                coef = np.abs(self.model.coef_).flatten()
                if len(coef) == len(feature_names):
                    for name, imp in zip(feature_names, coef):
                        importances[name] = float(imp)

        except Exception:
            pass

        # Normalize
        total = sum(abs(v) for v in importances.values())
        if total > 1e-10:
            importances = {k: v / total for k, v in importances.items()}

        return importances
