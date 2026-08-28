import joblib
from sklearn.ensemble import RandomForestClassifier
from typing import Optional

class RandomForestModel:
    """
    Random Forest Ensemble Classifier tuned for biomedical tabular diagnostics.
    Uses balanced class weights to prevent minority class bias in rare disease detection.
    """
    def __init__(self, n_estimators: int = 150, max_depth: Optional[int] = 6, random_state: int = 42):
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight='balanced',
            random_state=random_state
        )
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        
    def fit(self, X, y):
        self.model.fit(X, y)
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
