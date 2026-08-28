import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression

class LogisticRegressionModel:
    """
    Logistic Regression Linear Baseline Classifier with L2 regularization.
    Serves as an interpretable linear baseline for clinical benchmarking.
    """
    def __init__(self, C: float = 1.0, random_state: int = 42, max_iter: int = 1000):
        self.model = LogisticRegression(
            C=C,
            solver='lbfgs',
            class_weight='balanced',
            random_state=random_state,
            max_iter=max_iter
        )
        self.C = C
        
    def fit(self, X, y):
        self.model.fit(X, y)
        return self
        
    def predict(self, X):
        return self.model.predict(X)
        
    def predict_proba(self, X):
        return self.model.predict_proba(X)
        
    def get_feature_importance(self, feature_names: list[str]) -> dict[str, float]:
        if not hasattr(self.model, 'coef_'):
            return {}
        raw_coef = np.abs(self.model.coef_[0])
        total = sum(raw_coef) or 1.0
        return {name: float(coef / total) for name, coef in zip(feature_names, raw_coef)}
        
    def save(self, path: str):
        joblib.dump(self.model, path)
        
    def load(self, path: str):
        self.model = joblib.load(path)
        return self
