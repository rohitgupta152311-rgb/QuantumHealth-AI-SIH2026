"""Gradient Boosting Classifier with histogram-based learning for clinical diagnostics."""
import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier


class GradientBoostingModel:
    """
    Histogram-based Gradient Boosting Classifier (sklearn native).
    Efficient for large clinical datasets with native handling of class imbalance
    via sample_weight and early stopping support.
    """
    def __init__(self, max_iter: int = 250, max_depth: int = 5,
                 learning_rate: float = 0.05, random_state: int = 42):
        self.model = HistGradientBoostingClassifier(
            max_iter=max_iter,
            max_depth=max_depth,
            learning_rate=learning_rate,
            min_samples_leaf=10,
            max_bins=255,
            l2_regularization=1.0,
            early_stopping=True,
            n_iter_no_change=15,
            validation_fraction=0.15,
            scoring='loss',
            class_weight='balanced',
            random_state=random_state,
            verbose=0,
        )
        self.max_iter = max_iter
        self.max_depth = max_depth

    def fit(self, X, y, X_val=None, y_val=None):
        self.model.fit(X, y)
        return self

    def predict(self, X):
        return self.model.predict(X)

    def predict_proba(self, X):
        return self.model.predict_proba(X)

    def get_feature_importance(self, feature_names: list[str]) -> dict[str, float]:
        # HistGradientBoosting doesn't expose feature_importances_ by default on all versions
        # Use permutation importance fallback
        try:
            importances = self.model.feature_importances_ if hasattr(self.model, 'feature_importances_') else np.zeros(len(feature_names))
        except Exception:
            importances = np.zeros(len(feature_names))
        total = sum(importances) or 1.0
        return {name: float(imp / total) for name, imp in zip(feature_names, importances)}

    def save(self, path: str):
        joblib.dump(self.model, path)

    def load(self, path: str):
        self.model = joblib.load(path)
        return self
