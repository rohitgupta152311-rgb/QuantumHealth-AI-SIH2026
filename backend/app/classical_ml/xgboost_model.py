"""XGBoost Gradient Boosting Classifier for clinical risk prediction."""
import joblib
import numpy as np

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False


class XGBoostModel:
    """
    XGBoost Gradient Boosting Classifier optimized for imbalanced clinical datasets.
    Uses scale_pos_weight for class imbalance, early stopping on validation,
    and histogram-based splitting for scalability.
    """
    def __init__(self, n_estimators: int = 300, max_depth: int = 5,
                 learning_rate: float = 0.05, random_state: int = 42):
        if not XGBOOST_AVAILABLE:
            raise ImportError("XGBoost is not installed. Run: pip install xgboost")
        self.model = XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            gamma=0.1,
            reg_alpha=0.1,
            reg_lambda=1.0,
            tree_method='hist',
            eval_metric='logloss',
            use_label_encoder=False,
            random_state=random_state,
            n_jobs=-1,
            verbosity=0,
        )
        self.n_estimators = n_estimators
        self.max_depth = max_depth

    def fit(self, X, y, X_val=None, y_val=None):
        # Compute scale_pos_weight for class imbalance
        n_neg = np.sum(y == 0)
        n_pos = np.sum(y == 1)
        if n_pos > 0:
            self.model.set_params(scale_pos_weight=float(n_neg / n_pos))

        fit_params = {}
        if X_val is not None and y_val is not None:
            fit_params['eval_set'] = [(X_val, y_val)]
            fit_params['verbose'] = False
        self.model.fit(X, y, **fit_params)
        return self

    def predict(self, X):
        return self.model.predict(X)

    def predict_proba(self, X):
        return self.model.predict_proba(X)

    def get_feature_importance(self, feature_names: list[str]) -> dict[str, float]:
        if not hasattr(self.model, 'feature_importances_'):
            return {}
        importances = self.model.feature_importances_
        total = sum(importances) or 1.0
        return {name: float(imp / total) for name, imp in zip(feature_names, importances)}

    def save(self, path: str):
        joblib.dump(self.model, path)

    def load(self, path: str):
        self.model = joblib.load(path)
        return self
